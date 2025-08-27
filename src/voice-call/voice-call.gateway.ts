import { NotFoundException, UseFilters } from '@nestjs/common'
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { VoiceCallService } from './voice-call.service'
import {
  CallRequestDTO,
  CallAcceptDTO,
  CallRejectDTO,
  SDPOfferAnswerDTO,
  IceCandidateDTO,
  CallHangupDTO,
  CalleeSetSessionDTO,
} from './voice-call.dto'
import { EVoiceCallMessages } from './voice-call.message'
import { CatchInternalSocketError } from '@/utils/exception-filters/base-ws-exception.filter'
import { UserConnectionService } from '@/connection/user-connection.service'
import type { TVoiceCallSessionActiveId } from './voice-call.type'
import { EListenSocketEvents, EEmitSocketEvents } from '@/utils/events/socket.event'
import type { IVoiceCallGateway } from './voice-call.interface'
import { EVoiceCallStatus } from './voice-call.enum'
import { AuthService } from '@/auth/auth.service'
import { DevLogger } from '@/dev/dev-logger'
import type { TClientSocket } from '@/utils/events/event.type'
import { ESocketNamespaces } from '@/messaging/messaging.enum'
import { BaseWsExceptionsFilter } from '@/utils/exception-filters/base-ws-exception.filter'
import { UseInterceptors, UsePipes } from '@nestjs/common'
import { gatewayValidationPipe } from '@/utils/validation/gateway.validation'
import { VoiceCallGatewayInterceptor } from './voice-call.interceptor'

@WebSocketGateway({
  cors: {
    origin:
      process.env.NODE_ENV === 'production' ? process.env.CLIENT_HOST : process.env.CLIENT_HOST_DEV,
    credentials: true,
  },
  namespace: ESocketNamespaces.voice_call,
})
@UseFilters(new BaseWsExceptionsFilter())
@UsePipes(gatewayValidationPipe)
@UseInterceptors(VoiceCallGatewayInterceptor)
export class VoiceCallGateway
  implements
    OnGatewayConnection<TClientSocket>,
    OnGatewayDisconnect<TClientSocket>,
    OnGatewayInit<Server>,
    IVoiceCallGateway
{
  private readonly callTimeoutMs: number = 10000

  constructor(
    private readonly voiceCallService: VoiceCallService,
    private readonly userConnectionService: UserConnectionService,
    private readonly authService: AuthService
  ) {}

  /**
   * This function is called (called one time) when the server is initialized.
   * It sets the server and the server middleware.
   * The server middleware is used to validate the socket connection.
   * @param server - The server instance.
   */
  async afterInit(server: Server): Promise<void> {
    this.userConnectionService.setServer(server)
    this.userConnectionService.setServerMiddleware(async (socket, next) => {
      try {
        await this.authService.validateSocketConnection(socket)
      } catch (error) {
        next(error)
        return
      }
      next()
    })
  }

  /**
   * This function is called when a client connects to the server.
   * It validates the socket connection and adds the client to the connected clients list.
   * @param client - The client instance.
   */
  async handleConnection(client: TClientSocket): Promise<void> {
    DevLogger.logForWebsocket('connected socket:', {
      socketId: client.id,
      auth: client.handshake.auth,
    })
    try {
      await this.authService.validateVoiceCallSocketAuth(client)
      client.emit(EEmitSocketEvents.server_hello_voice_call, 'You connected sucessfully!')
    } catch (error) {
      DevLogger.logForWebsocket('error at handleConnection:', error)
      client.disconnect(true)
    }
  }

  /**
   * This function is called when a client disconnects from the server.
   * It removes the client from the connected clients list and the message tokens.
   * @param client - The client instance.
   */
  async handleDisconnect(client: TClientSocket): Promise<void> {
    DevLogger.logForWebsocket('disconnected socket:', {
      socketId: client.id,
      auth: client.handshake.auth,
    })
    const { userId } = client.handshake.auth
    if (userId) {
      this.voiceCallService.endCall(userId)
    }
  }

  async autoCancelCall(sessionId: TVoiceCallSessionActiveId) {
    setTimeout(() => {
      const session = this.voiceCallService.getActiveCallSession(sessionId)
      if (
        session &&
        (session.status === EVoiceCallStatus.REQUESTING ||
          session.status === EVoiceCallStatus.RINGING)
      ) {
        this.voiceCallService.endCall(sessionId)
        this.userConnectionService.announceCallStatus(
          session.callerUserId,
          EVoiceCallStatus.TIMEOUT
        )
        this.userConnectionService.announceCallStatus(
          session.calleeUserId,
          EVoiceCallStatus.TIMEOUT
        )
      }
    }, this.callTimeoutMs)
  }

  @SubscribeMessage(EListenSocketEvents.call_request)
  @CatchInternalSocketError()
  async onCallRequest(
    @ConnectedSocket() client: TClientSocket,
    @MessageBody() payload: CallRequestDTO
  ) {
    const { userId: callerUserId } = await this.authService.validateVoiceCallSocketAuth(client)
    const { calleeUserId, directChatId } = payload
    if (this.voiceCallService.isUserBusy(calleeUserId)) {
      return { status: EVoiceCallStatus.BUSY } // thông báo cho caller rằng callee đang bận
    }
    const session = this.voiceCallService.initActiveCallSession(
      callerUserId,
      calleeUserId,
      directChatId
    )
    if (!this.userConnectionService.checkUserIsConnected(calleeUserId)) {
      return { status: EVoiceCallStatus.OFFLINE } // thông báo cho caller rằng callee đang offline
    }
    // báo cho callee có cuộc gọi đến
    this.userConnectionService.announceCallRequestToCallee(session)
    // tự động hủy cuộc gọi nếu không có phản hồi
    this.autoCancelCall(session.id)

    return { status: EVoiceCallStatus.REQUESTING, session }
  }

  @SubscribeMessage(EListenSocketEvents.callee_set_session)
  @CatchInternalSocketError()
  async onCalleeSetSession(@MessageBody() dto: CalleeSetSessionDTO) {
    const session = this.voiceCallService.getActiveCallSession(dto.sessionId)
    if (!session) {
      throw new NotFoundException(EVoiceCallMessages.SESSION_NOT_FOUND)
    }
    this.userConnectionService.announceCalleeSetSession(session.calleeUserId)
  }

  @SubscribeMessage(EListenSocketEvents.call_accept)
  async onAccept(@MessageBody() dto: CallAcceptDTO) {
    const session = this.voiceCallService.acceptCall(dto.sessionId)
    this.userConnectionService.announceCallStatus(session.callerUserId, EVoiceCallStatus.ACCEPTED)
  }

  @SubscribeMessage(EListenSocketEvents.call_reject)
  async onReject(@MessageBody() dto: CallRejectDTO) {
    const session = this.voiceCallService.endCall(dto.sessionId)
    this.userConnectionService.announceCallStatus(session.callerUserId, EVoiceCallStatus.REJECTED)
  }

  @SubscribeMessage(EListenSocketEvents.call_offer_answer)
  async onOfferAnswer(
    @ConnectedSocket() client: TClientSocket,
    @MessageBody() payload: SDPOfferAnswerDTO
  ) {
    const session = this.voiceCallService.getActiveCallSession(payload.sessionId)
    if (!session) {
      throw new NotFoundException(EVoiceCallMessages.SESSION_NOT_FOUND)
    }
    const { userId } = await this.authService.validateVoiceCallSocketAuth(client)
    const { callerUserId, calleeUserId } = session
    const peerId = userId === callerUserId ? calleeUserId : callerUserId
    this.userConnectionService.announceSDPOfferAnswer(peerId, payload.SDP, payload.type)
  }

  @SubscribeMessage(EListenSocketEvents.call_ice)
  async onIce(@ConnectedSocket() client: Socket, @MessageBody() dto: IceCandidateDTO) {
    const session = this.voiceCallService.getActiveCallSession(dto.sessionId)
    if (!session) {
      throw new NotFoundException(EVoiceCallMessages.SESSION_NOT_FOUND)
    }
    const { userId } = await this.authService.validateVoiceCallSocketAuth(client)
    const { callerUserId, calleeUserId } = session
    const peerId = userId === callerUserId ? calleeUserId : callerUserId
    this.userConnectionService.announceIceCandidate(
      peerId,
      dto.candidate,
      dto.sdpMid,
      dto.sdpMLineIndex
    )
  }

  @SubscribeMessage(EListenSocketEvents.call_hangup)
  async onHangup(@ConnectedSocket() client: TClientSocket, @MessageBody() dto: CallHangupDTO) {
    const session = this.voiceCallService.getActiveCallSession(dto.sessionId)
    if (!session) {
      throw new NotFoundException(EVoiceCallMessages.SESSION_NOT_FOUND)
    }
    const { userId } = await this.authService.validateVoiceCallSocketAuth(client)
    const { callerUserId, calleeUserId } = session
    const peerId = userId === callerUserId ? calleeUserId : callerUserId
    this.voiceCallService.endCall(session.id)
    this.userConnectionService.announceCallHangup(peerId, dto.reason)
  }
}

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
import { Server } from 'socket.io'
import { VoiceCallService } from './voice-call.service'
import {
  CallRequestDTO,
  CallAcceptDTO,
  CallRejectDTO,
  SDPOfferAnswerDTO,
  IceCandidateDTO,
  CallHangupDTO,
} from './voice-call.dto'
import { EVoiceCallMessages } from './voice-call.message'
import { CatchInternalSocketError } from '@/utils/exception-filters/base-ws-exception.filter'
import type { TVoiceCallSessionActiveId } from './voice-call.type'
import {
  EVoiceCallListenSocketEvents,
  EVoiceCallEmitSocketEvents,
} from '@/utils/events/socket.event'
import type { IVoiceCallGateway } from './voice-call.interface'
import { EVoiceCallStatus } from './voice-call.enum'
import { AuthService } from '@/auth/auth.service'
import { DevLogger } from '@/dev/dev-logger'
import type { TVoiceCallClientSocket } from '@/utils/events/event.type'
import { ESocketNamespaces } from '@/messaging/messaging.enum'
import { BaseWsExceptionsFilter } from '@/utils/exception-filters/base-ws-exception.filter'
import { UseInterceptors, UsePipes } from '@nestjs/common'
import { gatewayValidationPipe } from '@/utils/validation/gateway.validation'
import { VoiceCallGatewayInterceptor } from './voice-call.interceptor'
import { VoiceCallConnectionService } from '@/connection/voice-call-connection.service'

@WebSocketGateway({
  cors: {
    origin: [
      process.env.NODE_ENV === 'production' ? process.env.CLIENT_HOST : process.env.CLIENT_HOST_DEV,
      'http://localhost:3000',
    ],
    credentials: true,
  },
  namespace: ESocketNamespaces.voice_call,
})
@UseFilters(new BaseWsExceptionsFilter())
@UsePipes(gatewayValidationPipe)
@UseInterceptors(VoiceCallGatewayInterceptor)
export class VoiceCallGateway
  implements
    OnGatewayConnection<TVoiceCallClientSocket>,
    OnGatewayDisconnect<TVoiceCallClientSocket>,
    OnGatewayInit<Server>,
    IVoiceCallGateway
{
  private readonly callTimeoutMs: number = 10000

  constructor(
    private readonly voiceCallService: VoiceCallService,
    private readonly voiceCallConnectionService: VoiceCallConnectionService,
    private readonly authService: AuthService
  ) {}

  /**
   * This function is called (called one time) when the server is initialized.
   * It sets the server and the server middleware.
   * The server middleware is used to validate the socket connection.
   * @param server - The server instance.
   */
  async afterInit(server: Server): Promise<void> {
    this.voiceCallConnectionService.setVoiceCallServer(server)
    this.voiceCallConnectionService.setVoiceCallServerMiddleware(async (socket, next) => {
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
  async handleConnection(client: TVoiceCallClientSocket): Promise<void> {
    DevLogger.logForWebsocket('connected socket:', {
      socketId: client.id,
      auth: client.handshake.auth,
    })
    try {
      const { userId } = await this.authService.validateVoiceCallSocketAuth(client)
      this.voiceCallConnectionService.addConnectedClient(userId, client)
      client.emit(EVoiceCallEmitSocketEvents.server_hello, 'You connected sucessfully!')
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
  async handleDisconnect(client: TVoiceCallClientSocket): Promise<void> {
    DevLogger.logForWebsocket('disconnected socket:', {
      socketId: client.id,
      auth: client.handshake.auth,
    })
    const { userId } = client.handshake.auth
    if (userId) {
      try {
        this.voiceCallService.endCall(userId)
      } catch (error) {
        DevLogger.logForWebsocket('error at handleDisconnect:', error)
      }
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
        this.voiceCallConnectionService.announceCallStatus(
          session.callerUserId,
          EVoiceCallStatus.TIMEOUT,
          session
        )
        this.voiceCallConnectionService.announceCallStatus(
          session.calleeUserId,
          EVoiceCallStatus.TIMEOUT,
          session
        )
      }
    }, this.callTimeoutMs)
  }

  @SubscribeMessage(EVoiceCallListenSocketEvents.client_hello)
  @CatchInternalSocketError()
  async handleClientHello(
    @MessageBody() payload: string,
    @ConnectedSocket() client: TVoiceCallClientSocket
  ) {
    console.log('\n>>> client hello at voice call:', payload)
    const { userId } = await this.authService.validateVoiceCallSocketAuth(client)
    console.log('>>> client id at voice call:', userId, '\n')
    return {
      success: true,
    }
  }

  @SubscribeMessage(EVoiceCallListenSocketEvents.call_request)
  @CatchInternalSocketError()
  async onCallRequest(
    @ConnectedSocket() client: TVoiceCallClientSocket,
    @MessageBody() payload: CallRequestDTO
  ) {
    const { userId: callerUserId } = await this.authService.validateVoiceCallSocketAuth(client)
    const { calleeUserId, directChatId } = payload
    if (!this.voiceCallConnectionService.checkUserIsConnected(calleeUserId)) {
      return { status: EVoiceCallStatus.OFFLINE } // thông báo cho caller rằng callee đang offline
    }
    if (this.voiceCallService.isUserBusy(calleeUserId)) {
      return { status: EVoiceCallStatus.BUSY } // thông báo cho caller rằng callee đang bận
    }
    const session = this.voiceCallService.initActiveCallSession(
      callerUserId,
      calleeUserId,
      directChatId
    )
    // báo cho callee có cuộc gọi đến
    this.voiceCallConnectionService.announceCallRequestToCallee(session)
    // tự động hủy cuộc gọi nếu không có phản hồi
    this.autoCancelCall(session.id)

    return { status: EVoiceCallStatus.REQUESTING, session }
  }

  @SubscribeMessage(EVoiceCallListenSocketEvents.call_accept)
  async onAccept(@MessageBody() dto: CallAcceptDTO) {
    const session = this.voiceCallService.acceptCall(dto.sessionId)
    this.voiceCallConnectionService.announceCallStatus(
      session.callerUserId,
      EVoiceCallStatus.ACCEPTED,
      session
    )
  }

  @SubscribeMessage(EVoiceCallListenSocketEvents.call_reject)
  async onReject(@MessageBody() dto: CallRejectDTO) {
    const session = this.voiceCallService.endCall(dto.sessionId)
    this.voiceCallConnectionService.announceCallStatus(
      session.callerUserId,
      EVoiceCallStatus.REJECTED,
      session
    )
  }

  @SubscribeMessage(EVoiceCallListenSocketEvents.call_offer_answer)
  async onOfferAnswer(
    @ConnectedSocket() client: TVoiceCallClientSocket,
    @MessageBody() payload: SDPOfferAnswerDTO
  ) {
    const session = this.voiceCallService.getActiveCallSession(payload.sessionId)
    if (!session) {
      throw new NotFoundException(EVoiceCallMessages.SESSION_NOT_FOUND)
    }
    const { userId } = await this.authService.validateVoiceCallSocketAuth(client)
    const { callerUserId, calleeUserId } = session
    const peerId = userId === callerUserId ? calleeUserId : callerUserId
    this.voiceCallConnectionService.announceSDPOfferAnswer(peerId, payload.SDP, payload.type)
  }

  @SubscribeMessage(EVoiceCallListenSocketEvents.call_ice)
  async onIce(
    @ConnectedSocket() client: TVoiceCallClientSocket,
    @MessageBody() dto: IceCandidateDTO
  ) {
    const session = this.voiceCallService.getActiveCallSession(dto.sessionId)
    if (!session) {
      throw new NotFoundException(EVoiceCallMessages.SESSION_NOT_FOUND)
    }
    const { userId } = await this.authService.validateVoiceCallSocketAuth(client)
    const { callerUserId, calleeUserId } = session
    const peerId = userId === callerUserId ? calleeUserId : callerUserId
    this.voiceCallConnectionService.announceIceCandidate(
      peerId,
      dto.candidate,
      dto.sdpMid,
      dto.sdpMLineIndex
    )
  }

  @SubscribeMessage(EVoiceCallListenSocketEvents.call_hangup)
  async onHangup(
    @ConnectedSocket() client: TVoiceCallClientSocket,
    @MessageBody() dto: CallHangupDTO
  ) {
    const session = this.voiceCallService.getActiveCallSession(dto.sessionId)
    if (!session) {
      throw new NotFoundException(EVoiceCallMessages.SESSION_NOT_FOUND)
    }
    const { userId } = await this.authService.validateVoiceCallSocketAuth(client)
    const { callerUserId, calleeUserId } = session
    const peerId = userId === callerUserId ? calleeUserId : callerUserId
    this.voiceCallService.endCall(session.id)
    this.voiceCallConnectionService.announceCallHangup(peerId, dto.reason)
  }
}

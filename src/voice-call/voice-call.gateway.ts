import { UseGuards } from '@nestjs/common'
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets'
import { Socket } from 'socket.io'
import { AuthGuard } from '../auth/auth.guard'
import { VoiceCallService } from './voice-call.service'
import {
  CallRequestDTO,
  CallAcceptDTO,
  CallRejectDTO,
  CallCancelDTO,
  SdpOfferDTO,
  SdpAnswerDTO,
  IceCandidateDTO,
  CallEndDTO,
} from './voice-call.dto'
import { EVoiceCallMessage } from './voice-call.message'
import { CatchInternalSocketError } from '@/utils/exception-filters/base-ws-exception.filter'
import { UserConnectionService } from '@/connection/user-connection.service'
import type { TVoiceCallSessionActiveId } from './voice-call.type'
import { TClientSocket } from '@/messaging/messaging.type'
import { EClientSocketEvents } from '@/utils/events/socket.event'
import type { IVoiceCallGateway } from './voice-call.interface'
import { EVoiceCallStatus } from './voice-call.enum'

@WebSocketGateway({ cors: true, namespace: '/ws' })
@UseGuards(AuthGuard)
export class VoiceCallGateway implements IVoiceCallGateway {
  private readonly callTimeoutMs: number = 10000

  constructor(
    private readonly voiceCallService: VoiceCallService,
    private readonly userConnectionService: UserConnectionService
  ) {}

  async autoCancelCall(sessionId: TVoiceCallSessionActiveId) {
    setTimeout(() => {
      const session = this.voiceCallService.getActiveCallSession(sessionId)
      if (
        session &&
        (session.status === EVoiceCallStatus.REQUESTING ||
          session.status === EVoiceCallStatus.RINGING)
      ) {
        this.voiceCallService.endCall(sessionId)
        // thông báo cho caller và callee rằng cuộc gọi đã hết hạn...
      }
    }, this.callTimeoutMs)
  }

  @SubscribeMessage(EClientSocketEvents.call_request)
  @CatchInternalSocketError()
  async onCallRequest(
    @ConnectedSocket() client: TClientSocket,
    @MessageBody() payload: CallRequestDTO
  ) {
    const callerUserId = client.data.userId
    const { calleeUserId, directChatId } = payload
    if (this.voiceCallService.isUserBusy(calleeUserId)) {
      // thông báo cho caller rằng callee đang bận
      return { status: EVoiceCallStatus.BUSY }
    }
    const sessionId = this.voiceCallService.initActiveCallSession(
      callerUserId,
      calleeUserId,
      directChatId
    )
    if (!this.userConnectionService.checkUserIsConnected(calleeUserId)) {
      // thông báo cho caller rằng callee đang offline
      return { status: EVoiceCallStatus.OFFLINE }
    }
    // báo cho callee có cuộc gọi đến
    this.userConnectionService.announceCallRequestToCallee(callerUserId, calleeUserId, directChatId)
    // tự động hủy cuộc gọi nếu không có phản hồi
    this.autoCancelCall(sessionId)

    return { status: EVoiceCallStatus.REQUESTING }
  }

  @SubscribeMessage(EVoiceCallEvents.call_cancel)
  async onCancel(@ConnectedSocket() client: Socket, @MessageBody() dto: CallCancelDTO) {
    const s = this.voiceCallService.getUserCallingSession(dto.sessionId)
    if (!s) return
    const calleeSocketId = this.connSvc.getSocketIdByUserId(s.calleeUserId)
    this.callSvc.end(s.id)
    if (calleeSocketId)
      client.to(calleeSocketId).emit('CALL_VOICE/STATUS', { status: CallVoiceStatus.ENDED })
    client.emit('CALL_VOICE/STATUS', { status: CallVoiceStatus.ENDED })
  }

  @SubscribeMessage('CALL_VOICE/ACCEPT')
  async onAccept(@ConnectedSocket() client: Socket, @MessageBody() dto: CallAcceptDto) {
    const r = this.callSvc.accept(dto.sessionId)
    if (r?.error) {
      client.emit('CALL_VOICE/STATUS', {
        status: CallVoiceStatus.FAILED,
        message: CallVoiceMessage.INVALID_STATE,
      })
      return
    }
    const s = r.session!
    const callerSocketId = this.connSvc.getSocketIdByUserId(s.callerUserId)
    client.emit('CALL_VOICE/STATUS', {
      status: CallVoiceStatus.ACCEPTED,
      message: CallVoiceMessage.CALL_ACCEPTED,
    })
    if (callerSocketId)
      client.to(callerSocketId).emit('CALL_VOICE/STATUS', { status: CallVoiceStatus.ACCEPTED })
  }

  @SubscribeMessage('CALL_VOICE/REJECT')
  async onReject(@ConnectedSocket() client: Socket, @MessageBody() dto: CallRejectDto) {
    const s = this.callSvc.get(dto.sessionId)
    if (!s) return
    const callerSocketId = this.connSvc.getSocketIdByUserId(s.callerUserId)
    this.callSvc.end(s.id)
    client.emit('CALL_VOICE/STATUS', {
      status: CallVoiceStatus.REJECTED,
      message: CallVoiceMessage.CALL_REJECTED,
    })
    if (callerSocketId)
      client.to(callerSocketId).emit('CALL_VOICE/STATUS', { status: CallVoiceStatus.REJECTED })
  }

  @SubscribeMessage('CALL_VOICE/OFFER')
  async onOffer(@ConnectedSocket() client: Socket, @MessageBody() dto: SdpOfferDto) {
    const s = this.callSvc.get(dto.sessionId)
    if (!s) return
    const calleeSocketId = this.connSvc.getSocketIdByUserId(s.calleeUserId)
    if (calleeSocketId) client.to(calleeSocketId).emit('CALL_VOICE/OFFER', dto)
    client.emit('CALL_VOICE/STATUS', {
      status: CallVoiceStatus.RINGING,
      message: CallVoiceMessage.SDP_OFFER_RELAYED,
    })
  }

  @SubscribeMessage('CALL_VOICE/ANSWER')
  async onAnswer(@ConnectedSocket() client: Socket, @MessageBody() dto: SdpAnswerDto) {
    const s = this.callSvc.get(dto.sessionId)
    if (!s) return
    const callerSocketId = this.connSvc.getSocketIdByUserId(s.callerUserId)
    if (callerSocketId) client.to(callerSocketId).emit('CALL_VOICE/ANSWER', dto)
    const connected = this.callSvc.connect(s.id)
    if (!connected?.error && callerSocketId) {
      client.to(callerSocketId).emit('CALL_VOICE/STATUS', { status: CallVoiceStatus.ESTABLISHED })
    }
    client.emit('CALL_VOICE/STATUS', {
      status: CallVoiceStatus.ESTABLISHED,
      message: CallVoiceMessage.SDP_ANSWER_RELAYED,
    })
  }

  @SubscribeMessage('CALL_VOICE/ICE')
  async onIce(@ConnectedSocket() client: Socket, @MessageBody() dto: IceCandidateDto) {
    const s = this.callSvc.get(dto.sessionId)
    if (!s) return
    const peerId = client.data.userId === s.callerUserId ? s.calleeUserId : s.callerUserId
    const peerSocketId = this.connSvc.getSocketIdByUserId(peerId)
    if (peerSocketId) client.to(peerSocketId).emit('CALL_VOICE/ICE', dto)
  }

  @SubscribeMessage('CALL_VOICE/END')
  async onEnd(@ConnectedSocket() client: Socket, @MessageBody() dto: CallEndDto) {
    const s = this.callSvc.get(dto.sessionId)
    if (!s) return
    const peerId = client.data.userId === s.callerUserId ? s.calleeUserId : s.callerUserId
    const peerSocketId = this.connSvc.getSocketIdByUserId(peerId)
    this.callSvc.end(s.id)
    if (peerSocketId)
      client.to(peerSocketId).emit('CALL_VOICE/STATUS', {
        status: CallVoiceStatus.ENDED,
        reason: dto.reason ?? 'NORMAL',
      })
    client.emit('CALL_VOICE/STATUS', {
      status: CallVoiceStatus.ENDED,
      reason: dto.reason ?? 'NORMAL',
    })
  }
}

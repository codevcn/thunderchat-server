import { Injectable } from '@nestjs/common'
import { Server } from 'socket.io'
import {
  EVoiceCallEmitSocketEvents,
  type IVoiceCallEmitSocketEvents,
} from '@/utils/events/socket.event'
import type { TUserId } from '@/user/user.type'
import type { TServerMiddleware, TSocketId } from './user-connection.type'
import { DevLogger } from '@/dev/dev-logger'
import { EHangupReason, ESDPType, EVoiceCallStatus } from '@/voice-call/voice-call.enum'
import type { TVoiceCallClientSocket } from '@/utils/events/event.type'
import type { TActiveVoiceCallSession } from '@/voice-call/voice-call.type'

@Injectable()
export class VoiceCallConnectionService {
  private voiceCallServer: Server<{}, IVoiceCallEmitSocketEvents>
  private readonly connectedClients = new Map<TUserId, TVoiceCallClientSocket[]>()

  setVoiceCallServer(server: Server): void {
    this.voiceCallServer = server
  }

  getVoiceCallServer(): Server {
    return this.voiceCallServer
  }

  setVoiceCallServerMiddleware(middleware: TServerMiddleware): void {
    this.voiceCallServer.use(middleware)
  }

  addConnectedClient(userId: TUserId, client: TVoiceCallClientSocket): void {
    const currentClients = this.getConnectedClient(userId)
    if (currentClients && currentClients.length > 0) {
      currentClients.push(client)
    } else {
      this.connectedClients.set(userId, [client])
    }
    this.printOutData('after add connected client:')
  }

  getConnectedClient(clientId: TUserId): TVoiceCallClientSocket[] | null {
    return this.connectedClients.get(clientId) || null
  }

  checkUserIsConnected(userId: TUserId): boolean {
    return (this.connectedClients.get(userId)?.length || 0) > 0
  }

  removeConnectedClient(userId: TUserId, socketId?: TSocketId): void {
    if (socketId) {
      const userSockets = this.getConnectedClient(userId)
      if (userSockets && userSockets.length > 0) {
        this.connectedClients.set(
          userId,
          userSockets.filter((socket) => socket.id !== socketId)
        )
      }
    } else {
      this.connectedClients.delete(userId)
    }
  }

  printOutData(prefixMessage?: string) {
    if (prefixMessage) {
      DevLogger.logInfo(`\n${prefixMessage}`)
    }
    for (const [key, value] of this.connectedClients) {
      for (const client of value) {
        DevLogger.logInfo(`key: ${key} - something: ${client.handshake?.auth.clientId}`)
      }
    }
  }

  announceCallRequestToCallee(activeCallSession: TActiveVoiceCallSession) {
    const calleeSockets = this.getConnectedClient(activeCallSession.calleeUserId)
    if (calleeSockets && calleeSockets.length > 0) {
      for (const socket of calleeSockets) {
        socket.emit(EVoiceCallEmitSocketEvents.call_request, activeCallSession)
      }
    }
  }

  announceCallStatus(
    userId: TUserId,
    status: EVoiceCallStatus,
    activeCallSession?: TActiveVoiceCallSession
  ) {
    const userSockets = this.getConnectedClient(userId)
    if (userSockets && userSockets.length > 0) {
      for (const socket of userSockets) {
        socket.emit(EVoiceCallEmitSocketEvents.call_status, status, activeCallSession)
      }
    }
  }

  announceSDPOfferAnswer(userId: TUserId, SDP: string, type: ESDPType) {
    const userSockets = this.getConnectedClient(userId)
    if (userSockets && userSockets.length > 0) {
      for (const socket of userSockets) {
        socket.emit(EVoiceCallEmitSocketEvents.call_offer_answer, SDP, type)
      }
    }
  }

  announceIceCandidate(
    userId: TUserId,
    candidate: string,
    sdpMid?: string,
    sdpMLineIndex?: number
  ) {
    const userSockets = this.getConnectedClient(userId)
    if (userSockets && userSockets.length > 0) {
      for (const socket of userSockets) {
        socket.emit(EVoiceCallEmitSocketEvents.call_ice, candidate, sdpMid, sdpMLineIndex)
      }
    }
  }

  announceCallHangup(userId: TUserId, reason?: EHangupReason) {
    const userSockets = this.getConnectedClient(userId)
    if (userSockets && userSockets.length > 0) {
      for (const socket of userSockets) {
        socket.emit(EVoiceCallEmitSocketEvents.call_hangup, reason)
      }
    }
  }
}

import { Injectable } from '@nestjs/common'
import { Server, Socket } from 'socket.io'
import { EventsMap } from 'socket.io/dist/typed-events'
import type { TUserWithProfile } from '@/utils/entities/user.entity'
import type { IEmitSocketEvents } from '../gateway.interface'
import { EClientSocketEvents } from '../gateway.event'
import { EFriendRequestStatus } from '@/friend-request/friend-request.enum'
import type { TGetFriendRequestsData } from '@/friend-request/friend-request.type'
import type { TUserId } from '@/user/user.type'
import type { TServerMiddleware } from './socket.type'
import { DevLogger } from '@/dev/dev-logger'

@Injectable()
export class SocketService {
  private server: Server
  private readonly connectedClients = new Map<TUserId, Socket>()

  setServer(server: Server): void {
    this.server = server
  }

  getServer(): Server {
    return this.server
  }

  setServerMiddleware(middleware: TServerMiddleware): void {
    this.server.use(middleware)
  }

  addConnectedClient(userId: TUserId, client: Socket): void {
    this.connectedClients.set(userId, client)
  }

  getConnectedClient<T extends EventsMap = EventsMap>(clientId: TUserId): Socket<T> | null {
    return this.connectedClients.get(clientId) || null
  }

  removeConnectedClient(userId: TUserId): void {
    this.connectedClients.delete(userId)
  }

  printOutSession() {
    for (const [key, value] of this.connectedClients) {
      DevLogger.logInfo(`key: ${key} - something: ${value.handshake?.auth.clientId}`)
    }
  }

  sendFriendRequest(
    sender: TUserWithProfile,
    recipientId: TUserId,
    requestData: TGetFriendRequestsData
  ): void {
    const recipientSocket = this.getConnectedClient<IEmitSocketEvents>(recipientId)
    if (recipientSocket) {
      recipientSocket.emit(EClientSocketEvents.send_friend_request, sender, requestData)
    }
  }

  friendRequestAction(senderId: number, requestId: number, action: EFriendRequestStatus): void {
    const senderSocket = this.getConnectedClient<IEmitSocketEvents>(senderId)
    if (senderSocket) {
      senderSocket.emit(EClientSocketEvents.friend_request_action, {
        requestId,
        action,
      })
    }
  }

  checkUserOnlineStatus(userId: TUserId): boolean {
    return this.connectedClients.has(userId)
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size
  }

  async emitToDirectChat(directChatId: number, event: EClientSocketEvents, payload: any) {
    if (this.server) {
      const room = `direct_chat_${directChatId}`
      const sockets = await this.server.in(room).fetchSockets()
      const socketIds = sockets.map((s) => s.id)
      console.log(
        '[SOCKET][PIN_MESSAGE] Emit',
        event,
        'to room:',
        room,
        '| socketIds:',
        socketIds,
        '| payload:',
        payload
      )
      this.server.to(room).emit(event, payload)
    }
  }

  emitToUser(userId: TUserId, event: EClientSocketEvents, payload: any): void {
    const userSocket = this.getConnectedClient<IEmitSocketEvents>(userId)
    if (userSocket) {
      console.log(
        '[SOCKET][PIN_DIRECT_CHAT] Emit',
        event,
        'to user:',
        userId,
        '| payload:',
        payload
      )
      userSocket.emit(event, payload)
    }
  }
}

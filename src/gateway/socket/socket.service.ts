import { Injectable } from '@nestjs/common'
import { Server, Socket } from 'socket.io'
import { EventsMap } from 'socket.io/dist/typed-events'
import type { TUserWithProfile } from '@/utils/entities/user.entity'
import type { IEmitSocketEvents } from '../gateway.interface'
import { EClientSocketEvents } from '../gateway.event'
import { EFriendRequestStatus } from '@/friend-request/friend-request.enum'
import type { TGetFriendRequestsData } from '@/friend-request/friend-request.type'
import type { TUserId } from '@/user/user.type'
import type { TCreateGroupChatRoomNameHandler, TServerMiddleware, TSocketId } from './socket.type'
import { DevLogger } from '@/dev/dev-logger'
import { TMessageFullInfo } from '@/utils/entities/message.entity'
import { TGroupChat } from '@/utils/entities/group-chat.entity'
import { TDirectChat } from '@/utils/entities/direct-chat.entity'
import { EChatType, EUserOnlineStatus } from '@/utils/enums'

@Injectable()
export class SocketService {
  private server: Server
  private readonly connectedClients = new Map<TUserId, Socket[]>()

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
    const currentClients = this.getConnectedClient(userId)
    if (currentClients && currentClients.length > 0) {
      currentClients.push(client)
    } else {
      this.connectedClients.set(userId, [client])
    }
  }

  getConnectedClient<T extends EventsMap = EventsMap>(clientId: TUserId): Socket<T>[] | null {
    return this.connectedClients.get(clientId) || null
  }

  getConnectedClientsList<T extends EventsMap = EventsMap>(clientIds: TUserId[]): Socket<T>[][] {
    const clientsSet: Socket<T>[][] = []
    for (const clientId of clientIds) {
      const clients = this.getConnectedClient(clientId)
      if (clients && clients.length > 0) {
        clientsSet.push(clients)
      }
    }
    return clientsSet
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

  printOutSession() {
    for (const [key, value] of this.connectedClients) {
      for (const client of value) {
        DevLogger.logInfo(`key: ${key} - something: ${client.handshake?.auth.clientId}`)
      }
    }
  }

  sendFriendRequest(
    sender: TUserWithProfile,
    recipientId: TUserId,
    requestData: TGetFriendRequestsData
  ): void {
    const recipientSockets = this.getConnectedClient<IEmitSocketEvents>(recipientId)
    if (recipientSockets && recipientSockets.length > 0) {
      for (const socket of recipientSockets) {
        socket.emit(EClientSocketEvents.send_friend_request, sender, requestData)
      }
    }
  }

  friendRequestAction(senderId: number, requestId: number, action: EFriendRequestStatus): void {
    const senderSockets = this.getConnectedClient<IEmitSocketEvents>(senderId)
    if (senderSockets && senderSockets.length > 0) {
      for (const socket of senderSockets) {
        socket.emit(EClientSocketEvents.friend_request_action, {
          requestId,
          action,
        })
      }
    }
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size
  }

  async emitToDirectChat(directChatId: number, event: EClientSocketEvents, payload: any) {
    if (this.server) {
      const room = `direct_chat_room-${directChatId}`
      this.server.to(room).emit(event, payload)
    }
  }

  getUserOnlineStatus(userId: TUserId): EUserOnlineStatus {
    const userSockets = this.getConnectedClient(userId)
    return !!userSockets && userSockets.length > 0
      ? EUserOnlineStatus.ONLINE
      : EUserOnlineStatus.OFFLINE
  }

  checkUserIsOnline(userId: TUserId): boolean {
    return this.getUserOnlineStatus(userId) === EUserOnlineStatus.ONLINE
  }

  emitToUser(userId: TUserId, event: EClientSocketEvents, payload: any): void {
    const userSockets = this.getConnectedClient<IEmitSocketEvents>(userId)
    if (userSockets && userSockets.length > 0) {
      for (const socket of userSockets) {
        socket.emit(event, payload)
      }
    }
  }

  sendNewMessageToRecipient(
    recipientId: TUserId,
    newMessage: TMessageFullInfo,
    isNewDirectChat: boolean,
    directChat: TDirectChat,
    sender: TUserWithProfile
  ) {
    const recipientSockets = this.getConnectedClient<IEmitSocketEvents>(recipientId)
    if (recipientSockets && recipientSockets.length > 0) {
      for (const socket of recipientSockets) {
        socket.emit(EClientSocketEvents.send_message_direct, newMessage)
        if (isNewDirectChat) {
          socket.emit(
            EClientSocketEvents.new_conversation,
            directChat,
            null,
            EChatType.DIRECT,
            newMessage,
            sender
          )
        }
      }
    }
  }

  sendNewMessageToGroupChat(
    groupChatId: TGroupChat['id'],
    newMessage: TMessageFullInfo,
    createGroupChatRoomNameHandler: TCreateGroupChatRoomNameHandler
  ) {
    this.server
      .to(createGroupChatRoomNameHandler(groupChatId))
      .emit(EClientSocketEvents.send_message_group, newMessage)
  }

  broadcastCreateGroupChat(
    groupChat: TGroupChat,
    groupMemberIds: number[],
    creator: TUserWithProfile
  ) {
    const groupChatSockets = this.getConnectedClientsList<IEmitSocketEvents>(groupMemberIds)
    if (groupChatSockets && groupChatSockets.length > 0) {
      for (const socketsList of groupChatSockets) {
        for (const socket of socketsList) {
          socket.emit(
            EClientSocketEvents.new_conversation,
            null,
            groupChat,
            EChatType.GROUP,
            null,
            creator
          )
        }
      }
    }
  }

  broadcastUserOnlineStatus(userId: TUserId, onlineStatus: EUserOnlineStatus) {
    this.server.emit(EClientSocketEvents.broadcast_user_online_status, userId, onlineStatus)
  }
}

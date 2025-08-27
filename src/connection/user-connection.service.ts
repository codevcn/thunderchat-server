import { Injectable } from '@nestjs/common'
import { Server } from 'socket.io'
import type { TUserWithProfile } from '@/utils/entities/user.entity'
import { EEmitSocketEvents, IEmitSocketEvents } from '@/utils/events/socket.event'
import { EFriendRequestStatus } from '@/friend-request/friend-request.enum'
import type { TGetFriendRequestsData } from '@/friend-request/friend-request.type'
import type { TUserId } from '@/user/user.type'
import type { TServerMiddleware, TSocketId } from './user-connection.type'
import { DevLogger } from '@/dev/dev-logger'
import type { TMessageFullInfo } from '@/utils/entities/message.entity'
import type { TGroupChat } from '@/utils/entities/group-chat.entity'
import type { TDirectChat } from '@/utils/entities/direct-chat.entity'
import { EChatType, EUserOnlineStatus } from '@/utils/enums'
import { createDirectChatRoomName, createGroupChatRoomName } from '@/utils/helpers'
import { UpdateProfileDto } from '@/profile/profile.dto'
import { EHangupReason, ESDPType, EVoiceCallStatus } from '@/voice-call/voice-call.enum'
import type { TClientSocket } from '@/utils/events/event.type'
import type { TActiveVoiceCallSession } from '@/voice-call/voice-call.type'

@Injectable()
export class UserConnectionService {
  private server: Server<{}, IEmitSocketEvents>
  private readonly connectedClients = new Map<TUserId, TClientSocket[]>()
  private readonly userChattingConnections = new Map<TUserId, TDirectChat['id'][]>()

  setServer(server: Server): void {
    this.server = server
  }

  getServer(): Server {
    return this.server
  }

  setServerMiddleware(middleware: TServerMiddleware): void {
    this.server.use(middleware)
  }

  addConnectedClient(userId: TUserId, client: TClientSocket): void {
    const currentClients = this.getConnectedClient(userId)
    if (currentClients && currentClients.length > 0) {
      currentClients.push(client)
    } else {
      this.connectedClients.set(userId, [client])
    }
  }

  getConnectedClient(clientId: TUserId): TClientSocket[] | null {
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
    const recipientSockets = this.getConnectedClient(recipientId)
    if (recipientSockets && recipientSockets.length > 0) {
      for (const socket of recipientSockets) {
        socket.emit(EEmitSocketEvents.send_friend_request, sender, requestData)
      }
    }
  }

  friendRequestAction(senderId: number, requestId: number, action: EFriendRequestStatus): void {
    const senderSockets = this.getConnectedClient(senderId)
    if (senderSockets && senderSockets.length > 0) {
      for (const socket of senderSockets) {
        socket.emit(EEmitSocketEvents.friend_request_action, {
          requestId,
          action,
        })
      }
    }
  }

  getConnectedClientsCountForAdmin(): number {
    // hàm chỉ dùng cho admin
    const connectedClients = this.connectedClients
    let count = 0
    for (const [_, value] of connectedClients) {
      if (value && value.length > 0) {
        count += 1
      }
    }
    return count
  }

  async emitToDirectChat(directChatId: number, event: EEmitSocketEvents, payload: any) {
    if (this.server) {
      const room = createDirectChatRoomName(directChatId)
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

  emitToUser(userId: TUserId, event: EEmitSocketEvents, payload: any): void {
    const userSockets = this.getConnectedClient(userId)
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
    const recipientSockets = this.getConnectedClient(recipientId)
    if (recipientSockets && recipientSockets.length > 0) {
      for (const socket of recipientSockets) {
        socket.emit(EEmitSocketEvents.send_message_direct, newMessage)
        if (isNewDirectChat) {
          socket.emit(
            EEmitSocketEvents.new_conversation,
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

  sendNewMessageToGroupChat(groupChatId: TGroupChat['id'], newMessage: TMessageFullInfo) {
    this.server
      .to(createGroupChatRoomName(groupChatId))
      .emit(EEmitSocketEvents.send_message_group, newMessage)
  }

  broadcastCreateGroupChat(
    groupChat: TGroupChat,
    groupMemberIds: number[],
    creator: TUserWithProfile
  ) {
    for (const groupMemberId of groupMemberIds) {
      const groupMemberSockets = this.getConnectedClient(groupMemberId)
      if (groupMemberSockets && groupMemberSockets.length > 0) {
        for (const socket of groupMemberSockets) {
          socket.emit(
            EEmitSocketEvents.new_conversation,
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
    this.server.emit(EEmitSocketEvents.broadcast_user_online_status, userId, onlineStatus)
  }

  broadcastAddMembersToGroupChat(
    groupChat: TGroupChat,
    groupMemberIds: number[],
    executor: TUserWithProfile
  ) {
    for (const groupMemberId of groupMemberIds) {
      const groupMemberSockets = this.getConnectedClient(groupMemberId)
      if (groupMemberSockets) {
        for (const socket of groupMemberSockets) {
          socket.emit(
            EEmitSocketEvents.new_conversation,
            null,
            groupChat,
            EChatType.GROUP,
            null,
            executor
          )
        }
      }
    }
    this.server
      .to(createGroupChatRoomName(groupChat.id))
      .emit(EEmitSocketEvents.add_group_chat_members, groupMemberIds, groupChat)
  }

  broadcastRemoveGroupChatMembers(groupChat: TGroupChat, groupMemberIds: number[]) {
    this.server
      .to(createGroupChatRoomName(groupChat.id))
      .emit(EEmitSocketEvents.remove_group_chat_members, groupMemberIds, groupChat)
  }

  broadcastUpdateGroupChat(groupChatId: number, groupChat: Partial<TGroupChat>) {
    this.server
      .to(createGroupChatRoomName(groupChatId))
      .emit(EEmitSocketEvents.update_group_chat_info, groupChatId, groupChat)
  }

  broadcastUpdateUserInfo(directChatId: number, updatedUserId: TUserId, updates: UpdateProfileDto) {
    this.server
      .to(createDirectChatRoomName(directChatId))
      .emit(EEmitSocketEvents.update_user_info, directChatId, updatedUserId, updates)
  }

  broadcastDeleteDirectChat(directChatId: number, deleter: TUserWithProfile) {
    this.server
      .to(createDirectChatRoomName(directChatId))
      .emit(EEmitSocketEvents.delete_direct_chat, directChatId, deleter)
  }

  broadcastDeleteGroupChat(groupChatId: number) {
    this.server
      .to(createGroupChatRoomName(groupChatId))
      .emit(EEmitSocketEvents.delete_group_chat, groupChatId)
  }

  broadcastMemberLeaveGroupChat(groupChatId: number, userId: number) {
    this.server
      .to(createGroupChatRoomName(groupChatId))
      .emit(EEmitSocketEvents.member_leave_group_chat, groupChatId, userId)
  }

  setUserChattingConnection(
    userId: TUserId,
    otherUserId: TUserId,
    directChatId: TDirectChat['id']
  ): void {
    const userConnections = this.userChattingConnections.get(userId)
    if (userConnections) {
      if (!userConnections.includes(directChatId)) userConnections.push(directChatId)
    } else {
      this.userChattingConnections.set(userId, [directChatId])
    }
    const otherUserConnections = this.userChattingConnections.get(otherUserId)
    if (otherUserConnections) {
      if (!otherUserConnections.includes(directChatId)) otherUserConnections.push(directChatId)
    } else {
      this.userChattingConnections.set(otherUserId, [directChatId])
    }
  }

  getUserChattingConnection(userId: TUserId): TDirectChat['id'][] | undefined {
    return this.userChattingConnections.get(userId)
  }

  removeChattingConnection(userId?: TUserId, recipientId?: TUserId): void {
    if (userId) {
      this.userChattingConnections.delete(userId)
    }
    if (recipientId) {
      this.userChattingConnections.delete(recipientId)
    }
  }

  announceCallRequestToCallee(activeCallSession: TActiveVoiceCallSession) {
    const calleeSockets = this.getConnectedClient(activeCallSession.calleeUserId)
    if (calleeSockets && calleeSockets.length > 0) {
      for (const socket of calleeSockets) {
        socket.emit(EEmitSocketEvents.call_request, activeCallSession)
      }
    }
  }

  announceCallStatus(userId: TUserId, status: EVoiceCallStatus) {
    const userSockets = this.getConnectedClient(userId)
    if (userSockets && userSockets.length > 0) {
      for (const socket of userSockets) {
        socket.emit(EEmitSocketEvents.call_status, status)
      }
    }
  }

  announceSDPOfferAnswer(userId: TUserId, SDP: string, type: ESDPType) {
    const userSockets = this.getConnectedClient(userId)
    if (userSockets && userSockets.length > 0) {
      for (const socket of userSockets) {
        socket.emit(EEmitSocketEvents.call_offer_answer, SDP, type)
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
        socket.emit(EEmitSocketEvents.call_ice, candidate, sdpMid, sdpMLineIndex)
      }
    }
  }

  announceCallHangup(userId: TUserId, reason?: EHangupReason) {
    const userSockets = this.getConnectedClient(userId)
    if (userSockets && userSockets.length > 0) {
      for (const socket of userSockets) {
        socket.emit(EEmitSocketEvents.call_hangup, reason)
      }
    }
  }

  announceCalleeSetSession(userId: TUserId) {
    const userSockets = this.getConnectedClient(userId)
    if (userSockets && userSockets.length > 0) {
      for (const socket of userSockets) {
        socket.emit(EEmitSocketEvents.callee_set_session)
      }
    }
  }
}

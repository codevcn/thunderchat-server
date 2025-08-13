import { Injectable } from '@nestjs/common'
import type { TUserId } from '@/user/user.type'
import type { TDirectChat } from '@/utils/entities/direct-chat.entity'

@Injectable()
export class UserConnectionService {
  private readonly userChattingConnections = new Map<TUserId, TDirectChat['id'][]>()

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
}

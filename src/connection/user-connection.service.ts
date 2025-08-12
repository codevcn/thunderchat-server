import { Injectable } from '@nestjs/common'
import type { TUserId } from '@/user/user.type'
import type { TDirectChat } from '@/utils/entities/direct-chat.entity'

@Injectable()
export class UserConnectionService {
  private readonly userChattingConnections = new Map<TUserId, TDirectChat['id']>()

  setUserChattingConnection(
    userId: TUserId,
    recipientId: TUserId,
    directChatId: TDirectChat['id']
  ): void {
    this.userChattingConnections.set(userId, directChatId)
    this.userChattingConnections.set(recipientId, directChatId)
  }

  getUserChattingConnection(userId: TUserId): TDirectChat['id'] | undefined {
    return this.userChattingConnections.get(userId)
  }

  removeChattingConnection(userId: TUserId, recipientId: TUserId): void {
    this.userChattingConnections.delete(userId)
    this.userChattingConnections.delete(recipientId)
  }
}

import { Injectable } from '@nestjs/common'
import type { TGlobalSearchData, TMessageSearchOffset, TUserSearchOffset } from './search.type'
import { ElasticsearchService } from '@/configs/elasticsearch/elasticsearch.service'
import { DirectMessageService } from '@/direct-message/direct-message.service'
import { UserService } from '@/user/user.service'
import { replaceHTMLTagInMessageContent } from '@/utils/helpers'
import { GroupMessageService } from '@/group-message/group-message.service'
import { EChatType } from '@/utils/enums'
import { SocketService } from '@/gateway/socket/socket.service'

@Injectable()
export class SearchService {
  constructor(
    private elasticSearchService: ElasticsearchService,
    private directMessageService: DirectMessageService,
    private groupMessageService: GroupMessageService,
    private userService: UserService,
    private socketService: SocketService
  ) {}

  async searchGlobally(
    keyword: string,
    userId: number,
    limit: number,
    selfUserId: number,
    messageSearchOffset?: TMessageSearchOffset,
    userSearchOffset?: TUserSearchOffset
  ): Promise<TGlobalSearchData> {
    const [messageHits, userHits] = await Promise.all([
      this.elasticSearchService.searchMessages(keyword, userId, limit, messageSearchOffset),
      this.elasticSearchService.searchUsers(keyword, limit, userSearchOffset),
    ])
    const messageIdObjects = messageHits
      .filter((message) => !!message._source)
      .map((message) => ({
        id: parseInt(message._id!),
        highlight: message.highlight,
      }))
    const messageIds = messageIdObjects.map((message) => message.id)
    const userIds = userHits.filter((user) => !!user._source).map((user) => parseInt(user._id!))
    // find direct messages and users by ids in database
    const [directMessages, groupMessages, users] = await Promise.all([
      this.directMessageService.findMessagesByIds(messageIds, limit),
      this.groupMessageService.findMessagesByIds(messageIds, limit),
      this.userService.findUsersByIdsNotSelfUser(userIds, selfUserId, limit),
    ])
    const finalMessages = [
      ...directMessages.map(({ id, Recipient, content, directChatId, createdAt }) => ({
        id,
        avatarUrl: Recipient.Profile!.avatar || undefined,
        conversationName: Recipient.Profile!.fullName,
        messageContent: replaceHTMLTagInMessageContent(content),
        highlights: messageIdObjects.find((m) => m.id === id)!.highlight?.content || [],
        chatType: EChatType.DIRECT,
        chatId: directChatId,
        createdAt: createdAt.toISOString(),
      })),
      ...groupMessages.map(({ id, GroupChat, content, groupChatId, createdAt }) => ({
        id,
        avatarUrl: GroupChat.avatarUrl || undefined,
        conversationName: GroupChat.name,
        messageContent: replaceHTMLTagInMessageContent(content),
        highlights: messageIdObjects.find((m) => m.id === id)!.highlight?.content || [],
        chatType: EChatType.GROUP,
        chatId: groupChatId,
        createdAt: createdAt.toISOString(),
      })),
    ]
    const finalUsers = users.map((user) => ({
      ...user,
      isOnline: this.socketService.checkUserOnlineStatus(user.id),
    }))
    const nextSearchOffset: TGlobalSearchData['nextSearchOffset'] = {
      messageSearchOffset: messageHits.at(-1)?.sort,
      userSearchOffset: userHits.at(-1)?.sort,
    }
    return {
      messages: finalMessages,
      users: finalUsers,
      nextSearchOffset,
    }
  }
}

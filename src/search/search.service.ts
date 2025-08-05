import { Injectable } from '@nestjs/common'
import type { TGlobalSearchData, TMessageSearchOffset, TUserSearchOffset } from './search.type'
import { ElasticsearchService } from '@/configs/elasticsearch/elasticsearch.service'
import { DirectMessageService } from '@/direct-message/direct-message.service'
import { UserService } from '@/user/user.service'
import { replaceHTMLTagInMessageContent } from '@/utils/helpers'
import { EChatType } from '@/utils/enums'
import { SocketService } from '@/gateway/socket/socket.service'

@Injectable()
export class SearchService {
  constructor(
    private elasticSearchService: ElasticsearchService,
    private directMessageService: DirectMessageService,
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
    // find messages and users by ids in database
    const [messages, users] = await Promise.all([
      this.directMessageService.findMessagesByIds(messageIds, limit),
      this.userService.findUsersByIdsNotSelfUser(userIds, selfUserId, limit),
    ])
    const finalMessages = messages.map<TGlobalSearchData['messages'][number]>(
      ({ id, GroupChat, content, directChatId, groupChatId, createdAt, Recipient }) => {
        let avatarUrl: string | undefined,
          conversationName: string = ''
        if (Recipient) {
          avatarUrl = Recipient.Profile!.avatar || undefined
          conversationName = Recipient.Profile!.fullName
        } else {
          avatarUrl = GroupChat!.Members[0].User.Profile!.avatar || undefined
          conversationName = GroupChat!.name
        }
        return {
          id,
          avatarUrl,
          conversationName,
          messageContent: replaceHTMLTagInMessageContent(content),
          highlights: messageIdObjects.find((m) => m.id === id)!.highlight?.content || [],
          chatType: directChatId ? EChatType.DIRECT : EChatType.GROUP,
          chatId: (directChatId || groupChatId)!,
          createdAt: createdAt.toISOString(),
        }
      }
    )
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

import { Injectable } from '@nestjs/common'
import { TGlobalSearchData } from './search.type'
import { ElasticsearchService } from '@/configs/elasticsearch/elasticsearch.service'
import { DirectMessageService } from '@/direct-message/direct-message.service'
import { UserService } from '@/user/user.service'
import { replaceHTMLTagInMessageContent } from '@/utils/helpers'
import { GroupMessageService } from '@/group-message/group-message.service'
import { EChatType } from '@/utils/enums'
import { SocketService } from '@/gateway/socket/socket.service'

@Injectable()
export class SearchService {
  private readonly SEARCH_LIMIT = 10

  constructor(
    private elasticSearchService: ElasticsearchService,
    private directMessageService: DirectMessageService,
    private groupMessageService: GroupMessageService,
    private userService: UserService,
    private socketService: SocketService
  ) {}

  async searchGlobally(keyword: string, userId: number): Promise<TGlobalSearchData> {
    const [messageHits, userHits] = await Promise.all([
      this.elasticSearchService.searchMessages(keyword, userId, this.SEARCH_LIMIT),
      this.elasticSearchService.searchUsers(keyword, this.SEARCH_LIMIT),
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
      this.directMessageService.findMessagesByIds(messageIds, this.SEARCH_LIMIT),
      this.groupMessageService.findMessagesByIds(messageIds, this.SEARCH_LIMIT),
      this.userService.findUsersByIds(userIds, this.SEARCH_LIMIT),
    ])
    const finalMessages = [
      ...directMessages.map(({ id, Recipient, content, directChatId }) => ({
        id,
        avatarUrl: Recipient.Profile!.avatar || undefined,
        conversationName: Recipient.Profile!.fullName,
        messageContent: replaceHTMLTagInMessageContent(content),
        highlights: messageIdObjects.find((m) => m.id === id)!.highlight?.content || [],
        chatType: EChatType.DIRECT,
        chatId: directChatId,
      })),
      ...groupMessages.map(({ id, GroupChat, content, groupChatId }) => ({
        id,
        avatarUrl: GroupChat.avatarUrl || undefined,
        conversationName: GroupChat.name,
        messageContent: replaceHTMLTagInMessageContent(content),
        highlights: messageIdObjects.find((m) => m.id === id)!.highlight?.content || [],
        chatType: EChatType.GROUP,
        chatId: groupChatId,
      })),
    ]
    const finalUsers = users.map((user) => ({
      ...user,
      isOnline: this.socketService.checkUserOnlineStatus(user.id),
    }))
    return {
      messages: finalMessages,
      users: finalUsers,
    }
  }
}

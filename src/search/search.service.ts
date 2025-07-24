import { Injectable } from '@nestjs/common'
import { TGlobalSearchData } from './search.type'
import { ElasticsearchService } from '@/configs/elasticsearch/elasticsearch.service'
import { SocketService } from '@/gateway/socket/socket.service'
import { DirectMessageService } from '@/direct-message/direct-message.service'
import { UserService } from '@/user/user.service'
import { replaceHTMLTagInMessageContent } from '@/utils/helpers'

@Injectable()
export class SearchService {
  private readonly SEARCH_LIMIT = 10

  constructor(
    private elasticSearchService: ElasticsearchService,
    private socketService: SocketService,
    private directMessageService: DirectMessageService,
    private userService: UserService
  ) {}

  async searchGlobally(keyword: string, userId: number): Promise<TGlobalSearchData> {
    const [directMessageHits, userHits] = await Promise.all([
      this.elasticSearchService.searchDirectMessages(keyword, userId, this.SEARCH_LIMIT),
      this.elasticSearchService.searchUsers(keyword, this.SEARCH_LIMIT),
    ])
    const directMessageIds = directMessageHits
      .filter((message) => !!message._source)
      .map((message) => ({
        id: parseInt(message._id!),
        highlight: message.highlight,
      }))
    const userIds = userHits.filter((user) => !!user._source).map((user) => parseInt(user._id!))
    // find direct messages and users by ids in database
    const [directMessages, users] = await Promise.all([
      this.directMessageService.findMessagesByIds(directMessageIds.map((message) => message.id)),
      this.userService.findUsersByIds(userIds),
    ])
    return {
      messages: directMessages.map((message) => {
        return {
          id: message.id,
          avatarUrl: message.Recipient.Profile!.avatar || undefined,
          conversationName: message.Recipient.Profile!.fullName,
          messageContent: replaceHTMLTagInMessageContent(message.content),
          highlights: directMessageIds.find((m) => m.id === message.id)!.highlight?.content || [],
        }
      }),
      users: users.map((user) => {
        return {
          id: user.id,
          avatarUrl: user.Profile!.avatar || undefined,
          fullName: user.Profile!.fullName,
        }
      }),
    }
  }
}

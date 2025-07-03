import { Injectable } from '@nestjs/common'
import { TGlobalSearchData } from './search.type'
import { ElasticsearchService } from '@/configs/elasticsearch/elasticsearch.service'
import { SocketService } from '@/gateway/socket/socket.service'

@Injectable()
export class SearchService {
   private readonly SEARCH_LIMIT = 10

   constructor(
      private elasticSearchService: ElasticsearchService,
      private socketService: SocketService
   ) {}

   async searchGlobally(keyword: string, userId: number): Promise<TGlobalSearchData> {
      const [directMessages, users] = await Promise.all([
         this.elasticSearchService.searchDirectMessages(keyword, userId, this.SEARCH_LIMIT),
         this.elasticSearchService.searchUsers(keyword, this.SEARCH_LIMIT),
      ])
      return {
         messages: directMessages.map((message) => {
            const { recipient } = message
            return {
               id: message.message_id,
               avatarUrl: recipient.avatar,
               conversationName: recipient.full_name || recipient.email,
               messageContent: message.content,
            }
         }),
         users: users.map((user) => {
            return {
               id: user.user_id,
               avatarUrl: user.avatar,
               fullName: user.full_name,
               isOnline: this.socketService.checkUserOnlineStatus(user.user_id),
            }
         }),
      }
   }
}

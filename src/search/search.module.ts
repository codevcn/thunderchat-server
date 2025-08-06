import { Module } from '@nestjs/common'
import { SearchController } from './search.controller'
import { SearchService } from './search.service'
import { ElasticsearchModule } from '@/configs/elasticsearch/elasticsearch.module'
import { UserModule } from '@/user/user.module'
import { DirectMessageModule } from '@/direct-message/direct-message.module'
import { SocketService } from '@/gateway/socket/socket.service'
import { DirectChatsModule } from '@/direct-chat/direct-chat.module'
import { GroupChatModule } from '@/group-chat/group-chat.module'

@Module({
  imports: [
    ElasticsearchModule,
    UserModule,
    DirectMessageModule,
    DirectChatsModule,
    GroupChatModule,
  ],
  controllers: [SearchController],
  providers: [SearchService, SocketService],
})
export class SearchModule {}

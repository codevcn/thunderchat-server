import { Module } from '@nestjs/common'
import { SearchController } from './search.controller'
import { SearchService } from './search.service'
import { ElasticsearchModule } from '@/configs/elasticsearch/elasticsearch.module'
import { UserModule } from '@/user/user.module'
import { DirectMessageModule } from '@/direct-message/direct-message.module'
import { SocketService } from '@/gateway/socket/socket.service'

@Module({
  imports: [ElasticsearchModule, UserModule, DirectMessageModule],
  controllers: [SearchController],
  providers: [SearchService, SocketService],
})
export class SearchModule {}

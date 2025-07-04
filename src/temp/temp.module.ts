import { Module } from '@nestjs/common'
import { TempController } from './temp.controller'
import { DirectMessageService } from '@/direct-message/direct-message.service'
import { ElasticsearchModule } from '@/configs/elasticsearch/elasticsearch.module'
import { MessageMappingModule } from '@/message-mapping/message-mapping.module'
import { SyncDataToESService } from '@/configs/elasticsearch/sync-data-to-ES/sync-data-to-ES.service'

@Module({
   imports: [ElasticsearchModule, MessageMappingModule],
   controllers: [TempController],
   providers: [DirectMessageService, SyncDataToESService],
})
export class TempModule {}

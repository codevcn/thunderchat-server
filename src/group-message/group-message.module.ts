import { Module } from '@nestjs/common'
import { GroupMessageController } from './group-message.controller'
import { GroupMessageService } from './group-message.service'
import { SyncDataToESModule } from '@/configs/elasticsearch/sync-data-to-ES/sync-data-to-ES.module'
import { MessageMappingModule } from '@/message-mapping/message-mapping.module'

@Module({
  imports: [SyncDataToESModule, MessageMappingModule],
  providers: [GroupMessageService],
  controllers: [GroupMessageController],
  exports: [GroupMessageService],
})
export class GroupMessageModule {}

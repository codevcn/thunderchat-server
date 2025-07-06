import { DirectMessageController } from '@/direct-message/direct-message.controller'
import { DirectMessageService } from '@/direct-message/direct-message.service'
import { UserModule } from '@/user/user.module'
import { Module } from '@nestjs/common'
import { SyncDataToESModule } from '@/configs/elasticsearch/sync-data-to-ES/sync-data-to-ES.module'
import { MessageMappingModule } from '@/message-mapping/message-mapping.module'

@Module({
  imports: [UserModule, SyncDataToESModule, MessageMappingModule],
  providers: [DirectMessageService],
  controllers: [DirectMessageController],
  exports: [DirectMessageService],
})
export class DirectMessageModule {}

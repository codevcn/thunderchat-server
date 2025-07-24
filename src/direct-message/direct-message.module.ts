import { DirectMessageController } from '@/direct-message/direct-message.controller'
import { DirectMessageService } from '@/direct-message/direct-message.service'
import { UserModule } from '@/user/user.module'
import { Module } from '@nestjs/common'
import { SyncDataToESModule } from '@/configs/elasticsearch/sync-data-to-ES/sync-data-to-ES.module'

@Module({
  imports: [UserModule, SyncDataToESModule],
  providers: [DirectMessageService],
  controllers: [DirectMessageController],
  exports: [DirectMessageService, SyncDataToESModule],
})
export class DirectMessageModule {}

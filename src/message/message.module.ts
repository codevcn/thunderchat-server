import { MessageController } from '@/message/message.controller'
import { MessageService } from '@/message/message.service'
import { UserModule } from '@/user/user.module'
import { Module } from '@nestjs/common'
import { SyncDataToESModule } from '@/configs/elasticsearch/sync-data-to-ES/sync-data-to-ES.module'

@Module({
  imports: [UserModule, SyncDataToESModule],
  providers: [MessageService],
  controllers: [MessageController],
  exports: [MessageService, SyncDataToESModule],
})
export class MessageModule {}

import { Module } from '@nestjs/common'
import { GroupMessageController } from './group-message.controller'
import { GroupMessageService } from './group-message.service'
import { SyncDataToESModule } from '@/configs/elasticsearch/sync-data-to-ES/sync-data-to-ES.module'
import { UserModule } from '@/user/user.module'

@Module({
  imports: [UserModule, SyncDataToESModule],
  providers: [GroupMessageService],
  controllers: [GroupMessageController],
  exports: [GroupMessageService, SyncDataToESModule],
})
export class GroupMessageModule {}

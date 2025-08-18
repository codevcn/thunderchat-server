import { Module } from '@nestjs/common'
import { PushNotificationController } from './push-notification.controller'
import { PushNotificationService } from './push-notification.service'
import { UserModule } from '@/user/user.module'

@Module({
  imports: [UserModule],
  controllers: [PushNotificationController],
  providers: [PushNotificationService],
  exports: [PushNotificationService],
})
export class PushNotificationModule {}

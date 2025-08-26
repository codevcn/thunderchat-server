import { Module } from '@nestjs/common'
import { FriendRequestController } from './friend-request.controller'
import { FriendRequestService } from './friend-request.service'
import { SocketModule } from '@/connection/user-connection.module'
import { UserModule } from '@/user/user.module'

@Module({
  imports: [UserModule, SocketModule],
  controllers: [FriendRequestController],
  providers: [FriendRequestService],
})
export class FriendRequestModule {}

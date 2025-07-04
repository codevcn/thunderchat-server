import { Module } from '@nestjs/common'
import { FriendController } from './friend.controller'
import { FriendService } from './friend.service'
import { UserModule } from '@/user/user.module'
import { SocketModule } from '@/gateway/socket/socket.module'

@Module({
   imports: [UserModule, SocketModule],
   controllers: [FriendController],
   providers: [FriendService],
})
export class FriendModule {}

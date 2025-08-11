import { Module } from '@nestjs/common'
import { PinService } from './pin.service'
import { PinController } from './pin.controller'
import { PrismaModule } from '../../configs/db/prisma.module'
import { UserModule } from '../../user/user.module'
import { SocketModule } from '@/gateway/socket/socket.module'
import { GroupChatModule } from '@/group-chat/group-chat.module'
import { GroupMemberModule } from '@/group-member/group-member.module'

@Module({
  imports: [PrismaModule, UserModule, SocketModule, GroupChatModule, GroupMemberModule],
  providers: [PinService],
  controllers: [PinController],
  exports: [PinService],
})
export class PinModule {}

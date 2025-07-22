import { Module, forwardRef } from '@nestjs/common'
import { PinDirectChatController } from './pin-direct-chat.controller'
import { PinDirectChatService } from './pin-direct-chat.service'
import { PrismaModule } from '@/configs/db/prisma.module'
import { SocketModule } from '@/gateway/socket/socket.module'
import { UserModule } from '@/user/user.module'

@Module({
  imports: [PrismaModule, forwardRef(() => SocketModule), UserModule],
  controllers: [PinDirectChatController],
  providers: [PinDirectChatService],
  exports: [PinDirectChatService],
})
export class PinDirectChatModule {}

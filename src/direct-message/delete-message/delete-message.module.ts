import { Module } from '@nestjs/common'
import { DeleteMessageController } from './delete-message.controller'
import { DeleteMessageService } from './delete-message.service'
import { SocketModule } from '@/gateway/socket/socket.module'
import { PrismaService } from '@/configs/db/prisma.service'
import { AuthModule } from '@/auth/auth.module'
import { UserModule } from '@/user/user.module'
import { UploadService } from '@/upload/upload.service'
import { UploadModule } from '@/upload/upload.module'

@Module({
  imports: [SocketModule, AuthModule, UserModule, UploadModule],
  controllers: [DeleteMessageController],
  providers: [DeleteMessageService, PrismaService, UploadService],
})
export class DeleteMessageModule {}

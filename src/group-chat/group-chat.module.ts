import { Module } from '@nestjs/common'
import { GroupChatController } from './group-chat.controller'
import { GroupChatService } from './group-chat.service'
import { S3UploadService } from '@/upload/s3-upload.service'
import { UserModule } from '@/user/user.module'

@Module({
  imports: [UserModule],
  controllers: [GroupChatController],
  providers: [GroupChatService, S3UploadService],
})
export class GroupChatModule {}

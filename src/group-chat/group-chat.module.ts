import { Module } from '@nestjs/common'
import { GroupChatController } from './group-chat.controller'
import { GroupChatService } from './group-chat.service'
import { S3UploadService } from '@/upload/s3-upload.service'
import { UserModule } from '@/user/user.module'
import { GroupMemberService } from '@/group-member/group-member.service'

@Module({
  imports: [UserModule],
  controllers: [GroupChatController],
  providers: [GroupChatService, S3UploadService, GroupMemberService],
  exports: [GroupChatService],
})
export class GroupChatModule {}

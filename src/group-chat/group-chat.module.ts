import { Module } from '@nestjs/common'
import { GroupChatController } from './group-chat.controller'
import { GroupChatService } from './group-chat.service'
import { S3UploadService } from '@/upload/s3-upload.service'
import { UserModule } from '@/user/user.module'
import { GroupMemberService } from '@/group-member/group-member.service'
import { DirectMessageModule } from '@/direct-message/direct-message.module'
import { InviteCodeService } from './invite-code.service'
import { JoinRequestsService } from './join-requests.service'
import { SocketService } from '@/gateway/socket/socket.service'

@Module({
  imports: [UserModule, DirectMessageModule],
  controllers: [GroupChatController],
  providers: [
    GroupChatService,
    S3UploadService,
    GroupMemberService,
    InviteCodeService,
    JoinRequestsService,
    SocketService,
  ],
  exports: [
    GroupChatService,
    S3UploadService,
    GroupMemberService,
    InviteCodeService,
    JoinRequestsService,
    SocketService,
  ],
})
export class GroupChatModule {}

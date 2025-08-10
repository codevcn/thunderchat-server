import { Module } from '@nestjs/common'
import { GroupMemberController } from './group-member.controller'
import { GroupMemberService } from './group-member.service'
import { UserModule } from '@/user/user.module'
import { DirectMessageModule } from '@/direct-message/direct-message.module'

@Module({
  imports: [UserModule, DirectMessageModule],
  providers: [GroupMemberService],
  controllers: [GroupMemberController],
  exports: [GroupMemberService],
})
export class GroupMemberModule {}

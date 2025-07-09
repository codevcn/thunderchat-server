import { Module } from '@nestjs/common'
import { GroupMemberController } from './group-member.controller'
import { GroupMemberService } from './group-member.service'
import { UserModule } from '@/user/user.module'

@Module({
  imports: [UserModule],
  providers: [GroupMemberService],
  controllers: [GroupMemberController],
  exports: [GroupMemberService],
})
export class GroupMemberModule {}

import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common'
import { GroupMemberService } from './group-member.service'
import {
  AddMembersToGroupChatDTO,
  FetchGroupChatMembersDTO,
  RemoveGroupChatMemberDTO,
} from './group-member.dto'
import { ERoutes } from '@/utils/enums'
import { SearchGroupChatMembersDTO } from '@/group-chat/group-chat.dto'
import { AuthGuard } from '@/auth/auth.guard'
import { IGroupMemberController } from './group-member.interface'
import { GroupChatRoles } from '@/auth/role/group-chat/group-chat-role.decorator'
import { EGroupChatRoles } from '@/group-chat/group-chat.enum'
import { GroupChatRoleGuard } from '@/auth/role/group-chat/group-chat-role.guard'
import { DevLogger } from '@/dev/dev-logger'
import type { TUserWithProfile } from '@/utils/entities/user.entity'
import { User } from '@/user/user.decorator'

@Controller(ERoutes.GROUP_MEMBER)
@UseGuards(AuthGuard)
export class GroupMemberController implements IGroupMemberController {
  constructor(private readonly groupMemberService: GroupMemberService) {}

  @Get('fetch-group-chat-members')
  @UseGuards(GroupChatRoleGuard)
  @GroupChatRoles(EGroupChatRoles.ADMIN, EGroupChatRoles.MEMBER)
  async fetchGroupChatMembers(@Query() query: FetchGroupChatMembersDTO) {
    const { groupChatId } = query
    return await this.groupMemberService.fetchGroupChatMembers(groupChatId)
  }

  @Get('search-group-chat-members')
  @UseGuards(GroupChatRoleGuard)
  @GroupChatRoles(EGroupChatRoles.ADMIN, EGroupChatRoles.MEMBER)
  async searchGroupChatMembers(@Query() query: SearchGroupChatMembersDTO) {
    const { groupChatId, keyword } = query
    return await this.groupMemberService.searchGroupChatMembers(groupChatId, keyword)
  }

  @Delete('remove-group-chat-member')
  @UseGuards(GroupChatRoleGuard)
  @GroupChatRoles(EGroupChatRoles.ADMIN)
  async removeGroupChatMember(@Query() body: RemoveGroupChatMemberDTO) {
    const { groupChatId, memberId } = body
    DevLogger.logInfo('Removing group chat member:', { groupChatId, memberId })
    await this.groupMemberService.removeGroupChatMember(groupChatId, memberId)
    return { success: true }
  }

  @Post('add-members')
  @UseGuards(GroupChatRoleGuard)
  @GroupChatRoles(EGroupChatRoles.ADMIN)
  async addMembersToGroupChat(
    @Body() body: AddMembersToGroupChatDTO,
    @User() user: TUserWithProfile
  ) {
    const { groupChatId, memberIds } = body
    const addedMembers = await this.groupMemberService.addMembersToGroupChat(
      groupChatId,
      memberIds,
      user
    )
    return {
      addedMembers,
    }
  }
}

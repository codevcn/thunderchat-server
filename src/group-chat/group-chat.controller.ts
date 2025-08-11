import {
  Controller,
  Delete,
  ParseFilePipe,
  FileTypeValidator,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  Body,
  Get,
  UseGuards,
  Put,
} from '@nestjs/common'
import { GroupChatService } from './group-chat.service'
import { FileInterceptor } from '@nestjs/platform-express'
import { IGroupChatsController } from './group-chat.interface'
import {
  CreateGroupChatDTO,
  CreateInviteLinkDTO,
  DeleteGroupChatAvatarDTO,
  FetchGroupChatDTO,
  FetchGroupChatsDTO,
  JoinGroupByInviteLinkDTO,
  UpdateGroupChatDTO,
  UpdateGroupChatPermissionDTO,
  FetchGroupChatPermissionsDTO,
  CreateJoinRequestDTO,
  FetchJoinRequestsDTO,
  ProcessJoinRequestDTO,
  FetchGroupChatByInviteCodeDTO,
} from './group-chat.dto'
import { ERoutes } from '@/utils/enums'
import { join } from 'path'
import { User } from '@/user/user.decorator'
import type { TUser, TUserWithProfile } from '@/utils/entities/user.entity'
import { AuthGuard } from '@/auth/auth.guard'
import { GroupChatRoles } from '@/auth/role/group-chat/group-chat-role.decorator'
import { EGroupChatRoles } from './group-chat.enum'
import { GroupChatRoleGuard } from '@/auth/role/group-chat/group-chat-role.guard'
import { InviteLinkService } from './invite-link.service'
import { JoinRequestsService } from './join-requests.service'

@Controller(ERoutes.GROUP_CHAT)
@UseGuards(AuthGuard)
export class GroupChatController implements IGroupChatsController {
  static readonly tempImagesDir = join(process.cwd(), 'src', 'upload', 'temp-images')

  constructor(
    private readonly groupChatService: GroupChatService,
    private readonly inviteLinkService: InviteLinkService,
    private readonly joinRequestsService: JoinRequestsService
  ) {}

  @Post('upload-group-avatar')
  @UseInterceptors(FileInterceptor('avatar', { dest: GroupChatController.tempImagesDir }))
  async uploadGroupChatAvatar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'image/*' })],
      })
    )
    avatar: Express.Multer.File
  ) {
    return await this.groupChatService.uploadGroupChatAvatar(avatar)
  }

  @Delete('delete-group-avatar')
  async deleteGroupChatAvatar(@Query() query: DeleteGroupChatAvatarDTO) {
    await this.groupChatService.deleteGroupChatAvatar(query.avatarUrl)
    return {
      success: true,
    }
  }

  @Post('create-group-chat')
  async createGroupChat(@Body() body: CreateGroupChatDTO, @User() user: TUserWithProfile) {
    const { groupName, memberIds, avatarUrl } = body
    return await this.groupChatService.createGroupChat(user, groupName, memberIds, avatarUrl)
  }

  @Get('fetch-group-chat')
  async fetchGroupChat(@Query() query: FetchGroupChatDTO, @User() user: TUserWithProfile) {
    const { groupChatId } = query
    return await this.groupChatService.fetchGroupChat(groupChatId, user.id)
  }

  @Get('fetch-group-chats')
  async fetchGroupChats(@Query() query: FetchGroupChatsDTO, @User() user: TUserWithProfile) {
    const { lastId, limit } = query
    return await this.groupChatService.findGroupChatsByUser(user.id, lastId, limit)
  }

  @Put('update-group-chat')
  async updateGroupChat(@Body() body: UpdateGroupChatDTO, @User() user: TUserWithProfile) {
    const { groupChatId, avatarUrl, groupName } = body
    await this.groupChatService.updateGroupChat(groupChatId, user.id, {
      avatarUrl,
      groupName,
    })
    return {
      success: true,
    }
  }

  @UseGuards(AuthGuard)
  @Post('create-invite-link')
  @UseGuards(GroupChatRoleGuard)
  @GroupChatRoles(EGroupChatRoles.ADMIN)
  async createInviteLink(@Body() body: CreateInviteLinkDTO) {
    const { groupChatId } = body
    return await this.inviteLinkService.createNewInviteLinkForGroupChat(groupChatId)
  }

  // @Get('join-group-by-invite-link')
  // @UseGuards(AuthGuard)
  // async joinGroupChatByInviteLink(
  //   @Query() query: JoinGroupByInviteLinkDTO,
  //   @User() user: TUserWithProfile
  // ) {
  //   const { token } = query
  //   return await this.inviteLinkService.joinGroupChatByInviteLink(token, user.id)
  // }

  @Put('update-permissions')
  @UseGuards(GroupChatRoleGuard)
  @GroupChatRoles(EGroupChatRoles.ADMIN)
  async updateGroupChatPermission(@Body() body: UpdateGroupChatPermissionDTO) {
    const { groupChatId, permissions } = body
    await this.groupChatService.updateGroupChatPermissions(groupChatId, permissions)
    return {
      success: true,
    }
  }

  @Get('fetch-permissions')
  async fetchGroupChatPermissions(@Query() query: FetchGroupChatPermissionsDTO) {
    const { groupChatId } = query
    return await this.groupChatService.fetchGroupChatPermissions(groupChatId)
  }

  @Get('fetch-join-requests')
  @UseGuards(GroupChatRoleGuard)
  @GroupChatRoles(EGroupChatRoles.ADMIN)
  async fetchJoinRequests(@Query() query: FetchJoinRequestsDTO) {
    const { groupChatId, status } = query
    return await this.joinRequestsService.fetchJoinRequests(groupChatId, status)
  }

  @Post('create-join-request')
  async createJoinRequest(@Body() body: CreateJoinRequestDTO, @User() user: TUser) {
    const { groupChatId } = body
    return await this.joinRequestsService.createJoinRequest(groupChatId, user.id)
  }

  @Put('process-join-request')
  @UseGuards(GroupChatRoleGuard)
  @GroupChatRoles(EGroupChatRoles.ADMIN)
  async processJoinRequest(@Body() body: ProcessJoinRequestDTO) {
    const { joinRequestId, status } = body
    return await this.joinRequestsService.processJoinRequest(joinRequestId, status)
  }

  @Get('fetch-group-chat-by-invite-code')
  async fetchGroupChatByInviteCode(@Query() query: FetchGroupChatByInviteCodeDTO) {
    const { inviteCode } = query
    return await this.groupChatService.fetchGroupChatByInviteCode(inviteCode)
  }
}

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
  DeleteGroupChatAvatarDTO,
  FetchGroupChatDTO,
  FetchGroupChatsDTO,
  UpdateGroupChatDTO,
} from './group-chat.dto'
import { ERoutes } from '@/utils/enums'
import { join } from 'path'
import { User } from '@/user/user.decorator'
import type { TUserWithProfile } from '@/utils/entities/user.entity'
import { AuthGuard } from '@/auth/auth.guard'
import { GroupChatRoles } from '@/auth/role/group-chat/group-chat-role.decorator'
import { EGroupChatRoles } from './group-chat.enum'
import { GroupChatRoleGuard } from '@/auth/role/group-chat/group-chat-role.guard'

@Controller(ERoutes.GROUP_CHAT)
@UseGuards(AuthGuard)
export class GroupChatController implements IGroupChatsController {
  static readonly tempImagesDir = join(process.cwd(), 'src', 'upload', 'temp-images')

  constructor(private readonly groupChatService: GroupChatService) {}

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
  @UseGuards(GroupChatRoleGuard)
  @GroupChatRoles(EGroupChatRoles.ADMIN)
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
}

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
} from '@nestjs/common'
import { GroupChatService } from './group-chat.service'
import { FileInterceptor } from '@nestjs/platform-express'
import { IGroupChatsController } from './group-chat.interface'
import { CreateGroupChatDTO, DeleteGroupChatAvatarDTO, FetchGroupChatDTO } from './group-chat.dto'
import { ERoutes } from '@/utils/enums'
import { join } from 'path'
import { User } from '@/user/user.decorator'
import type { TUser } from '@/utils/entities/user.entity'

@Controller(ERoutes.GROUP_CHAT)
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
  async createGroupChat(@Body() body: CreateGroupChatDTO) {
    const { groupName, memberIds, avatarUrl } = body
    return await this.groupChatService.createGroupChat(groupName, memberIds, avatarUrl)
  }

  @Get('fetch-group-chat')
  async fetchGroupChat(@Query() query: FetchGroupChatDTO, @User() user: TUser) {
    const { groupChatId } = query
    return await this.groupChatService.fetchGroupChat(groupChatId, user.id)
  }
}

import { AuthGuard } from '@/auth/auth.guard'
import { DirectChatService } from '@/direct-chat/direct-chat.service'
import { Controller, Get, UseGuards, Param, Query, NotFoundException } from '@nestjs/common'
import { ERoutes } from '@/utils/enums'
import { IDirectChatsController } from './direct-chat.interface'
import { FetchDirectChatDTO, FetchDirectChatsDTO } from './direct-chat.dto'
import { User } from '@/user/user.decorator'
import { TUser } from '@/utils/entities/user.entity'
import { EDirectChatMessages } from './direct-chat.message'

@Controller(ERoutes.DIRECT_CHAT)
@UseGuards(AuthGuard)
export class DirectChatController implements IDirectChatsController {
  constructor(private conversationService: DirectChatService) {}

  @Get('fetch/:conversationId')
  async fetchDirectChat(@Param() params: FetchDirectChatDTO, @User() user: TUser) {
    const directChat = await this.conversationService.findById(params.conversationId, user.id)
    if (!directChat) {
      throw new NotFoundException(EDirectChatMessages.DIRECT_CHAT_NOT_FOUND)
    }
    return directChat
  }

  // fetch all direct chats of user
  @Get('fetch-direct-chats')
  async fetchAllDirectChats(@Query() query: FetchDirectChatsDTO, @User() user: TUser) {
    const directChats = await this.conversationService.findDirectChatsByUser(
      user.id,
      query.lastId,
      query.limit
    )
    return directChats
  }
}

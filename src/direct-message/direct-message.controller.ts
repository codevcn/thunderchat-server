import { DirectMessageService } from '@/direct-message/direct-message.service'
import { ERoutes } from '@/utils/enums'
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { IDirectMessageController } from './direct-message.interface'
import { FetchMsgsParamsDTO, FetchMsgsParamsForGroupChatDTO } from './direct-message.dto'
import { AuthGuard } from '@/auth/auth.guard'
import { ESortTypes } from './direct-message.enum'
import { canSendDirectMessage } from './can-send-message.helper'
import { User } from '@/user/user.decorator'
import { CheckCanSendMessageDto } from './direct-message.dto'
import { ValidationPipe } from '@nestjs/common'

@Controller(ERoutes.MESSAGE)
@UseGuards(AuthGuard)
export class DirectMessageController implements IDirectMessageController {
  constructor(private directMessageService: DirectMessageService) {}

  @Get('get-messages')
  async fetchMessages(@Query() params: FetchMsgsParamsDTO) {
    const { directChatId, msgOffset, limit, sortType, isFirstTime } = params
    return await this.directMessageService.getOlderDirectMessagesHandler(
      msgOffset,
      directChatId,
      undefined,
      limit,
      isFirstTime,
      sortType
    )
  }

  @Get('direct-message/voices/:directChatId')
  async getVoiceMessages(
    @Param('directChatId') directChatId: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('sortType') sortType?: string
  ) {
    return this.directMessageService.getVoiceMessages(
      directChatId,
      limit ? Number(limit) : 100,
      offset ? Number(offset) : 0,
      sortType as ESortTypes
    )
  }
  @Get('context/:messageId')
  async getMessageContext(@Param('messageId') messageId: string) {
    return this.directMessageService.getMessageContext(Number(messageId))
  }

  @Get('get-newer-messages')
  async getNewerMessages(
    @Query('directChatId') directChatId: number,
    @Query('msgOffset') msgOffset: number,
    @Query('limit') limit: number
  ) {
    return this.directMessageService.getNewerDirectMessages(
      Number(msgOffset),
      Number(directChatId),
      undefined,
      Number(limit)
    )
  }

  @Get('can-send-message')
  async canSendMessage(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: CheckCanSendMessageDto,
    @User('id') userId: number
  ) {
    try {
      await canSendDirectMessage(
        this.directMessageService['PrismaService'],
        userId,
        query.receiverId
      )
      return { canSend: true }
    } catch (error) {
      return { canSend: false }
    }
  }

  @Get('get-group-messages')
  async fetchMessagesForGroupChat(@Query() params: FetchMsgsParamsForGroupChatDTO) {
    const { groupChatId, msgOffset, limit, sortType, isFirstTime } = params
    const result = await this.directMessageService.getOlderDirectMessagesHandler(
      msgOffset,
      undefined,
      groupChatId,
      limit,
      isFirstTime,
      sortType
    )
    return {
      hasMoreMessages: result.hasMoreMessages,
      groupMessages: result.directMessages,
    }
  }

  @Get('group-message/voices/:groupChatId')
  async getVoiceMessagesForGroupChat(
    @Param('groupChatId') groupChatId: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('sortType') sortType?: string
  ) {
    const result = await this.directMessageService.getVoiceMessages(
      groupChatId,
      limit ? Number(limit) : 100,
      offset ? Number(offset) : 0,
      sortType as ESortTypes
    )
    return {
      hasMoreMessages: result.hasMoreMessages,
      groupMessages: result.directMessages,
    }
  }

  @Get('get-newer-group-messages')
  async getNewerMessagesForGroupChat(
    @Query('groupChatId') groupChatId: number,
    @Query('msgOffset') msgOffset: number,
    @Query('limit') limit: number
  ) {
    return this.directMessageService.getNewerDirectMessages(
      Number(msgOffset),
      undefined,
      Number(groupChatId),
      Number(limit)
    )
  }
}

import { DirectMessageService } from '@/direct-message/direct-message.service'
import { ERoutes } from '@/utils/enums'
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { IDirectMessageController } from './direct-message.interface'
import { FetchMsgsParamsDTO } from './direct-message.dto'
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

  @Get('get-direct-messages')
  async fetchMessages(@Query() params: FetchMsgsParamsDTO) {
    const { directChatId, msgOffset, limit, sortType, isFirstTime } = params
    return await this.directMessageService.getOlderDirectMessagesHandler(
      msgOffset,
      directChatId,
      limit,
      isFirstTime,
      sortType
    )
  }

  @Get('direct-message/media/:directChatId')
  async getMediaMessages(
    @Param('directChatId') directChatId: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('sortType') sortType?: string
  ) {
    return this.directMessageService.getMediaMessages(
      directChatId,
      limit ? Number(limit) : 100,
      offset ? Number(offset) : 0,
      sortType as ESortTypes
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
    console.log('[DirectMessageController] Nhận request GET /context/' + messageId)
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
      Number(limit)
    )
  }

  @Get('can-send-message')
  async canSendMessage(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: CheckCanSendMessageDto,
    @User('id') userId: number
  ) {
    const canSend = await canSendDirectMessage(
      this.directMessageService['PrismaService'],
      userId,
      query.receiverId
    )
    return { canSend }
  }
}

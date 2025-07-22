import { DirectMessageService } from '@/direct-message/direct-message.service'
import { ERoutes } from '@/utils/enums'
import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common'
import { IDirectMessageController } from './direct-message.interface'
import { FetchMsgsParamsDTO } from './direct-message.dto'
import { AuthGuard } from '@/auth/auth.guard'

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
}

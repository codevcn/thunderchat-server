import { DirectMessageService } from '@/direct-message/direct-message.service'
import { ERoutes } from '@/utils/enums'
import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { IMessageController } from './direct-message.interface'
import { FetchMsgsParamsDTO } from './direct-message.dto'
import { AuthGuard } from '@/auth/auth.guard'

@Controller(ERoutes.MESSAGE)
@UseGuards(AuthGuard)
export class MessageController implements IMessageController {
   constructor(private DirectMessageService: DirectMessageService) {}

   @Get('get-direct-messages')
   async fetchMessages(@Query() params: FetchMsgsParamsDTO) {
      const { directChatId, msgOffset, limit, sortType, isFirstTime } = params
      return await this.DirectMessageService.getOlderDirectMessagesHandler(
         msgOffset,
         directChatId,
         limit,
         isFirstTime,
         sortType
      )
   }
}

import { AuthGuard } from '@/auth/auth.guard'
import { DirectChatService } from '@/direct-chat/direct-chat.service'
import { Controller, Get, UseGuards, Param } from '@nestjs/common'
import { ERoutes } from '@/utils/enums'
import { IDirectChatsController } from './direct-chat.interface'

@Controller(ERoutes.DIRECT_CHAT)
@UseGuards(AuthGuard)
export class DirectChatController implements IDirectChatsController {
   constructor(private conversationService: DirectChatService) {}

   @Get('fetch/:conversationId')
   async fetchDirectChat(@Param('conversationId') conversationId: string) {
      return await this.conversationService.findById(parseInt(conversationId))
   }
}

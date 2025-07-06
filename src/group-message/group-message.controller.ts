import { GroupMessageService } from '@/group-message/group-message.service'
import { ERoutes } from '@/utils/enums'
import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { IGroupMessageController } from './group-message.interface'
import { FetchMsgsParamsDTO } from './group-message.dto'
import { AuthGuard } from '@/auth/auth.guard'

@Controller(ERoutes.MESSAGE)
@UseGuards(AuthGuard)
export class GroupMessageController implements IGroupMessageController {
  constructor(private GroupMessageService: GroupMessageService) {}

  @Get('get-group-messages')
  async fetchMessages(@Query() params: FetchMsgsParamsDTO) {
    const { groupChatId, msgOffset, limit, sortType, isFirstTime } = params
    return await this.GroupMessageService.getOlderGroupMessagesHandler(
      msgOffset,
      groupChatId,
      limit,
      isFirstTime,
      sortType
    )
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { FriendService } from './friend.service'
import { GetFriendsDTO } from './friend.dto'
import type { IFriendController } from './friend.interface'
import { ERoutes } from '@/utils/enums'
import { AuthGuard } from '@/auth/auth.guard'

@Controller(ERoutes.FRIEND)
@UseGuards(AuthGuard)
export class FriendController implements IFriendController {
   constructor(private friendService: FriendService) {}

   @Get('get-friends')
   async getFriends(@Query() getFriendsPayload: GetFriendsDTO) {
      return await this.friendService.getFriends(getFriendsPayload)
   }
}

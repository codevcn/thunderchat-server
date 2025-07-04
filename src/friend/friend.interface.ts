import type { GetFriendsDTO } from './friend.dto'
import type { TGetFriendsData } from './friend.type'

export interface IFriendController {
   getFriends: (getFriendsPayload: GetFriendsDTO) => Promise<TGetFriendsData[]>
}

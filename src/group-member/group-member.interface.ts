import type { TGroupChatMemberWithUser } from '@/utils/entities/group-chat-member.entity'
import type { FetchGroupChatMembersDTO } from './group-member.dto'
import type { TUserWithProfile } from '@/utils/entities/user.entity'
import type { SearchGroupChatMembersDTO } from '@/group-chat/group-chat.dto'

export interface IGroupMemberController {
  fetchGroupChatMembers: (
    query: FetchGroupChatMembersDTO,
    user: TUserWithProfile
  ) => Promise<TGroupChatMemberWithUser[]>
  searchGroupChatMembers: (
    query: SearchGroupChatMembersDTO,
    user: TUserWithProfile
  ) => Promise<TGroupChatMemberWithUser[]>
}

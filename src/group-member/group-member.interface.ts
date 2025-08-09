import type { TGroupChatMemberWithUser } from '@/utils/entities/group-chat-member.entity'
import type {
  AddMembersToGroupChatDTO,
  FetchGroupChatMembersDTO,
  RemoveGroupChatMemberDTO,
} from './group-member.dto'
import type { TUserWithProfile } from '@/utils/entities/user.entity'
import type { SearchGroupChatMembersDTO } from '@/group-chat/group-chat.dto'
import type { TSuccess } from '@/utils/types'
import type { TAddMembersToGroupChatRes } from './group-member.type'

export interface IGroupMemberController {
  fetchGroupChatMembers: (
    query: FetchGroupChatMembersDTO,
    user: TUserWithProfile
  ) => Promise<TGroupChatMemberWithUser[]>
  searchGroupChatMembers: (
    query: SearchGroupChatMembersDTO,
    user: TUserWithProfile
  ) => Promise<TGroupChatMemberWithUser[]>
  removeGroupChatMember: (
    body: RemoveGroupChatMemberDTO,
    user: TUserWithProfile
  ) => Promise<TSuccess>
  addMembersToGroupChat(
    body: AddMembersToGroupChatDTO,
    user: TUserWithProfile
  ): Promise<TAddMembersToGroupChatRes>
}

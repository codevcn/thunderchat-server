import type { GroupChatMember } from '@prisma/client'
import type { TUser } from './user.entity'
import type { TProfile } from './profile.entity'

export type TGroupChatMember = GroupChatMember

export type TGroupChatMemberWithUser = Omit<TGroupChatMember, 'userId'> & {
  User: TUser & {
    Profile: TProfile | null
  }
}

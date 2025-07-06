import { GroupChatMember } from '@prisma/client'
import { TUser } from './user.entity'

export type TGroupChatMember = GroupChatMember

export type TGroupChatMemberWithUser = Omit<TGroupChatMember, 'userId'> & {
  User: TUser
}

import type { GroupChat } from '@prisma/client'
import type { TGroupChatMemberWithUser } from './group-chat-member.entity'

export type TGroupChat = GroupChat

export type TGroupChatWithMembers = TGroupChat & {
  Members: TGroupChatMemberWithUser[]
}

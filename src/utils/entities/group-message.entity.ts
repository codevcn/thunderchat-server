import type { GroupChat, GroupMessage } from '@prisma/client'

export type TGroupMessage = GroupMessage

export type TGroupMessageWithGroupChat = GroupMessage & {
  GroupChat: GroupChat
}

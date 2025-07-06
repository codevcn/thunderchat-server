import type { TGroupChatMemberWithUser } from '@/utils/entities/group-chat-member.entity'
import type { TGroupChat } from '@/utils/entities/group-chat.entity'

export type TFetchGroupChatData = TGroupChat & {
  Members: TGroupChatMemberWithUser[]
}

export type TUploadGroupChatAvatar = {
  avatarUrl: string
}

import type { TGroupChat } from '@/utils/entities/group-chat.entity'
import type { TUserWithProfile } from '@/utils/entities/user.entity'
import type { TMessage } from '@/utils/entities/message.entity'
import type { TGroupChatMemberWithUser } from '@/utils/entities/group-chat-member.entity'

export type TFetchGroupChatData = TGroupChat & {
  Members: TGroupChatMemberWithUser[]
}

export type TUploadGroupChatAvatar = {
  avatarUrl: string
}

export type TFetchGroupChatsData = TGroupChat & {
  LastSentMessage: TMessage | null
  Creator: TUserWithProfile
}

export type TGenerateInviteLink = {
  token: string
}

export type TCreateNewInviteLink = {
  inviteCode: string
}

export type TJoinGroupChatByInviteLink = {
  groupChatId: number
  message?: string
}

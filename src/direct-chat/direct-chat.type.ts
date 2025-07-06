import type { TDirectChat } from '@/utils/entities/direct-chat.entity'
import type { TDirectMessage } from '@/utils/entities/direct-message.entity'
import type { TUserWithProfile } from '@/utils/entities/user.entity'

export type TSearchDirectChatParams = {
  email?: string
  creatorId: number
  nameOfUser?: string
}

export type TFindDirectChatData = TDirectChat & {
  Recipient: TUserWithProfile
  Creator: TUserWithProfile
}

export type TUpdateDirectChatData = Partial<{
  lastSentMessageId: number
}>

export type TFetchDirectChatsData = TDirectChat & {
  LastSentMessage: TDirectMessage | null
  Recipient: TUserWithProfile
  Creator: TUserWithProfile
}

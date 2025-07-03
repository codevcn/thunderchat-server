import type { TDirectChat } from '@/utils/entities/direct-chat.entity'
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

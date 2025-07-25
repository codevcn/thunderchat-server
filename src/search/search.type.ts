import type { EChatType } from '@/utils/enums'
import type { TUserWithProfile } from '@/utils/entities/user.entity'

export type TGlobalSearchData = {
  users: (TUserWithProfile & {
    isOnline: boolean
  })[]
  messages: {
    id: number
    avatarUrl?: string
    conversationName: string
    messageContent: string
    highlights: string[]
    chatType: EChatType
    chatId: number
  }[]
}

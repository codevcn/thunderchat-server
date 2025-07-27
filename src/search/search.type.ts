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
    createdAt: string
  }[]
}

export type TMessageSearchOffset = {
  created_at: string
  id: string
}

export type TUserSearchOffset = {
  full_name: string
  email: string
  id: string
}

export type TConversationSearchResult = {
  id: number
  type: EChatType
  title: string
  avatar?: {
    src: string
  }
  subtitle?: {
    content: string
  }
}

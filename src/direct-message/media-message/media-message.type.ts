import type { TDirectMessageWithAuthorAndReplyTo } from '@/utils/entities/direct-message.entity'

export type TMediaItem = TDirectMessageWithAuthorAndReplyTo

export type TPaginationInfo = {
  currentPage: number
  totalPages: number
  totalItems: number
  hasMore: boolean
  limit: number
}

export type TGetMediaMessagesResponse = {
  success: boolean
  data: {
    items: TMediaItem[]
    pagination: TPaginationInfo
  }
  message?: string
  errorCode?: string | null
  errors?: any
}

export type TMediaFilters = {
  type?: 'image' | 'video' | 'file' | 'voice'
  types?: ('image' | 'video' | 'file' | 'voice')[]
  senderId?: number
  fromDate?: string
  toDate?: string
}

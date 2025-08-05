import type { TMessageFullInfo } from '@/utils/entities/message.entity'
import { EMessageTypes } from '../direct-message.enum'

export type TMediaItem = TMessageFullInfo

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

export type TCountMessageMedia = {
  message_type: string | null
  total: bigint | null
}

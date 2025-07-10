import type {
  TDirectMessage,
  TDirectMessageWithAuthorAndReplyTo,
} from '@/utils/entities/direct-message.entity'
import type { EMessageStatus } from '@/utils/types'
import type { EMessageTypes } from './direct-message.enum'

export type TNewGroupMessage = {
  id: number
  content: string
  authorId: number
  directChatId: number
  createdAt: Date
}

export type TGetDirectMessagesData = {
  hasMoreMessages: boolean
  directMessages: TGetDirectMessagesMessage[]
}

export type TMsgStatusPayload = {
  messageId: number
  status: EMessageStatus
}

export type TMessageOffset = TDirectMessage['id']

export type TMessageUpdates = Partial<
  Omit<TDirectMessage, 'id' | 'createdAt' | 'updatedAt' | 'content'>
>

export type TSendMessageDto = {
  content?: string
  type: EMessageTypes
  mediaUrl?: string
}

export type TGetDirectMessagesMessage = TDirectMessageWithAuthorAndReplyTo

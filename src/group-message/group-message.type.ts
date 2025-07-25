import type { TGroupMessage } from '@/utils/entities/group-message.entity'
import type { EMessageStatus } from '@/utils/enums'

export type TNewGroupMessage = {
  id: number
  content: string
  authorId: number
  groupChatId: number
  createdAt: Date
}

export type TGetGroupMessagesData = {
  hasMoreMessages: boolean
  groupMessages: TGroupMessage[]
}

export type TMsgStatusPayload = {
  messageId: number
  status: EMessageStatus
}

export type TMessageOffset = TGroupMessage['id']

export type TMessageUpdates = Partial<
  Omit<TGroupMessage, 'id' | 'createdAt' | 'updatedAt' | 'content'>
>

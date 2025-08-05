import type { Socket } from 'socket.io'
import type { IEmitSocketEvents } from './gateway.interface'
import type { TUserId } from '@/user/user.type'
import type { TDirectChat } from '@/utils/entities/direct-chat.entity'
import type { TSuccess } from '@/utils/types'
import type { TMessageWithAuthorAndReplyTo } from '@/utils/entities/message.entity'

export type TClientSocket = Socket<{}, IEmitSocketEvents>

export type TClientAuth = {
  clientId: number
}

export type TMsgToken = string

export type TConversationTypingFlags = {
  [key: TUserId]: NodeJS.Timeout
}

export type TUserKey = {
  encryptMsgKey: string
}

export type TSendDirectMessageRes = TSuccess & {
  directChat: TDirectChat
  newMessage: TMessageWithAuthorAndReplyTo
  isNewDirectChat: boolean
}

export type TFindDirectChatWithOtherUser = {
  directChat: TDirectChat
  isNew: boolean
}

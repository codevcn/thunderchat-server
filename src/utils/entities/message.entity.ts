import type { Message } from '@prisma/client'
import type { TUserWithProfile } from './user.entity'
import type { TMessageMedia } from './message-media.entity'
import type { TGroupChatWithMembers } from './group-chat.entity'

export type TMessage = Message

export type TMessageWithAuthor = TMessage & {
  Author: TUserWithProfile
}

export type TMessageWithRecipient = TMessage & {
  Recipient: TUserWithProfile | null
}

export type TMessageWithRecipients = TMessage & {
  Recipient: TUserWithProfile | null
  GroupChat: TGroupChatWithMembers | null
}

export type TMessageWithAuthorAndReplyTo = TMessageWithAuthor & {
  ReplyTo: TMessageWithAuthor | null
}

export type TMessageWithMedia = TMessage & {
  Media: TMessageMedia | null
}

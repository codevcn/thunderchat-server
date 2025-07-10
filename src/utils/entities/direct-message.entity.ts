import type { DirectMessage } from '@prisma/client'
import type { TUserWithProfile } from './user.entity'

export type TDirectMessage = DirectMessage

export type TDirectMessageWithAuthor = TDirectMessage & {
  Author: TUserWithProfile
}

export type TDirectMessageWithAuthorAndReplyTo = TDirectMessageWithAuthor & {
  ReplyTo: TDirectMessageWithAuthor | null
}

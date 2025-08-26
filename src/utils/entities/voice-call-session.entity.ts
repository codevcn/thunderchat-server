import type { VoiceCallSession } from '@prisma/client'
import type { TUserWithProfile } from './user.entity'

export type TVoiceCallSession = VoiceCallSession

export type TVoiceCallSessionWithUsers = VoiceCallSession & {
  caller: TUserWithProfile
  callee: TUserWithProfile
}

export type TVoiceCallSessionId = TVoiceCallSession['id']

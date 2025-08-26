import type { TDirectChat } from '@/utils/entities/direct-chat.entity'
import type { EVoiceCallStatus } from './voice-call.enum'

import { TUserId } from '@/user/user.type'
export type TVoiceCallRequestRes = {
  status: EVoiceCallStatus
}

export type TVoiceCallSessionActiveId = string

export type TActiveVoiceCallSession = {
  id: TVoiceCallSessionActiveId
  status: EVoiceCallStatus
  callerUserId: TUserId
  calleeUserId: TUserId
  directChatId: TDirectChat['id']
}

import type { TClientSocket } from '@/messaging/messaging.type'
import type { CallRequestDTO } from './voice-call.dto'
import type { TVoiceCallRequestRes } from './voice-call.type'

export interface IVoiceCallGateway {
  onCallRequest: (client: TClientSocket, payload: CallRequestDTO) => Promise<TVoiceCallRequestRes>
}

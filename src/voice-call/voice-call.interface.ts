import type {
  CallRejectDTO,
  IceCandidateDTO,
  SDPOfferAnswerDTO,
  CallAcceptDTO,
  CallHangupDTO,
  CallRequestDTO,
} from './voice-call.dto'
import type { TVoiceCallRequestRes } from './voice-call.type'
import type { TClientSocket } from '@/utils/events/event.type'

export interface IVoiceCallGateway {
  onCallRequest: (client: TClientSocket, payload: CallRequestDTO) => Promise<TVoiceCallRequestRes>
  onAccept: (payload: CallAcceptDTO) => Promise<void>
  onReject: (payload: CallRejectDTO) => Promise<void>
  onOfferAnswer: (client: TClientSocket, payload: SDPOfferAnswerDTO) => Promise<void>
  onIce: (client: TClientSocket, payload: IceCandidateDTO) => Promise<void>
  onHangup: (client: TClientSocket, payload: CallHangupDTO) => Promise<void>
}

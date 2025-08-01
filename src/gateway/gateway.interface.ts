import type { TUserWithProfile } from '@/utils/entities/user.entity'
import type { EClientSocketEvents, EInitEvents } from './gateway.event'
import type {
  TGetDirectMessagesMessage,
  TMsgStatusPayload,
} from '@/direct-message/direct-message.type'
import type { TWsErrorResponse } from '@/utils/types'
import type { MarkAsSeenDTO, SendDirectMessageDTO, TypingDTO } from './gateway.dto'
import type { Socket } from 'socket.io'
import type { TClientSocket, TSendDirectMessageRes } from './gateway.type'
import type {
  TFriendRequestPayload,
  TGetFriendRequestsData,
} from '@/friend-request/friend-request.type'

export interface IEmitSocketEvents {
  [EInitEvents.client_connected]: (message: string) => void
  [EClientSocketEvents.send_message_direct]: (payload: TGetDirectMessagesMessage) => void
  [EClientSocketEvents.send_friend_request]: (
    payload: TUserWithProfile,
    requestData: TGetFriendRequestsData
  ) => void
  [EClientSocketEvents.error]: (error: TWsErrorResponse) => void
  [EClientSocketEvents.recovered_connection]: (messages: TGetDirectMessagesMessage[]) => void
  [EClientSocketEvents.message_seen_direct]: (payload: TMsgStatusPayload) => void
  [EClientSocketEvents.typing_direct]: (isTyping: boolean) => void
  [EClientSocketEvents.friend_request_action]: (payload: TFriendRequestPayload) => void
  [EClientSocketEvents.pin_message]: (payload: any) => void
  [EClientSocketEvents.pin_direct_chat]: (payload: any) => void
}

export interface IGateway {
  handleSendDirectMessage: (
    payload: SendDirectMessageDTO,
    client: Socket<IEmitSocketEvents>
  ) => Promise<TSendDirectMessageRes>
  handleMarkAsSeenInDirectChat: (data: MarkAsSeenDTO, client: TClientSocket) => Promise<void>
  handleTyping: (data: TypingDTO, client: TClientSocket) => Promise<void>
}

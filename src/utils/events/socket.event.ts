import type { TGetDirectMessagesMessage, TMsgStatusPayload } from '@/message/message.type'
import type { TUserWithProfile } from '../entities/user.entity'
import type {
  TFriendRequestPayload,
  TGetFriendRequestsData,
} from '@/friend-request/friend-request.type'
import type { TWsErrorResponse } from '../types'
import type { TDirectChat } from '../entities/direct-chat.entity'
import type { EChatType, EUserOnlineStatus } from '../enums'
import type { TGroupChat } from '../entities/group-chat.entity'
import type { TMessage } from '../entities/message.entity'
import type { TUserId } from '@/user/user.type'
import type { CallRequestDTO } from '@/voice-call/voice-call.dto'

export enum EClientSocketEvents {
  client_hello = 'client_hello',
  server_hello = 'server_hello',
  send_message_direct = 'send_message:direct',
  send_message_group = 'send_message:group',
  join_group_chat_room = 'join_group_chat_room',
  send_friend_request = 'friend_request:send',
  error = 'error',
  recovered_connection = 'recovered_connection',
  message_seen_direct = 'message_seen:direct',
  typing_direct = 'typing:direct',
  friend_request_action = 'friend_request_action',
  pin_message = 'pin_message',
  pin_message_group = 'pin_message:group',
  pin_direct_chat = 'pin_direct_chat',
  new_conversation = 'new_conversation',
  broadcast_user_online_status = 'broadcast_user_online_status',
  check_user_online_status = 'check_user_online_status',
  join_direct_chat_room = 'join_direct_chat_room',
  remove_group_chat_members = 'remove_group_chat_members',
  add_group_chat_members = 'add_group_chat_members',
  update_group_chat_info = 'update_group_chat_info',
  update_user_info = 'update_user_info',
  delete_direct_chat = 'delete_direct_chat',
  delete_group_chat = 'delete_group_chat',
  member_leave_group_chat = 'member_leave_group_chat',
  call_request = 'voice_call:request',
  // call_request_ack = 'voice_call:request_ack',
  // call_accept = 'voice_call:accept',
  // call_reject = 'voice_call:reject',
  // call_cancel = 'voice_call:cancel',
  // call_end = 'voice_call:end',
  // call_status = 'voice_call:status',
  // call_offer = 'voice_call:offer',
  // call_answer = 'voice_call:answer',
  // call_ice = 'voice_call:ice',
}

export interface IEmitSocketEvents {
  [EClientSocketEvents.server_hello]: (payload: string) => void
  [EClientSocketEvents.send_message_direct]: (payload: TGetDirectMessagesMessage) => void
  [EClientSocketEvents.send_friend_request]: (
    payload: TUserWithProfile,
    requestData: TGetFriendRequestsData
  ) => void
  [EClientSocketEvents.error]: (error: TWsErrorResponse) => void
  [EClientSocketEvents.recovered_connection]: (messages: TGetDirectMessagesMessage[]) => void
  [EClientSocketEvents.message_seen_direct]: (payload: TMsgStatusPayload) => void
  [EClientSocketEvents.typing_direct]: (isTyping: boolean, directChatId: number) => void
  [EClientSocketEvents.friend_request_action]: (payload: TFriendRequestPayload) => void
  [EClientSocketEvents.pin_message]: (payload: any) => void
  [EClientSocketEvents.pin_direct_chat]: (payload: any) => void
  [EClientSocketEvents.new_conversation]: (
    directChat: TDirectChat | null,
    groupChat: TGroupChat | null,
    type: EChatType,
    newMessage: TMessage | null,
    sender: TUserWithProfile
  ) => void
  [EClientSocketEvents.broadcast_user_online_status]: (
    userId: TUserId,
    onlineStatus: EUserOnlineStatus
  ) => void
  [EClientSocketEvents.remove_group_chat_members]: (
    memberIds: number[],
    groupChat: TGroupChat
  ) => void
  [EClientSocketEvents.add_group_chat_members]: (
    newMemberIds: number[],
    groupChat: TGroupChat
  ) => void
  [EClientSocketEvents.call_request]: (
    callerUserId: TUserId,
    directChatId: TDirectChat['id']
  ) => void
  [EClientSocketEvents.update_group_chat_info]: () => void // not used
  [EClientSocketEvents.update_user_info]: () => void // not used
  [EClientSocketEvents.check_user_online_status]: () => void // not used
  [EClientSocketEvents.send_message_group]: () => void // not used
  [EClientSocketEvents.join_group_chat_room]: () => void // not used
  [EClientSocketEvents.join_direct_chat_room]: () => void // not used
  [EClientSocketEvents.pin_message_group]: () => void // not used
  [EClientSocketEvents.delete_direct_chat]: () => void // not used
  [EClientSocketEvents.delete_group_chat]: () => void // not used
  [EClientSocketEvents.member_leave_group_chat]: () => void // not used
  [EClientSocketEvents.client_hello]: () => void // not used
}

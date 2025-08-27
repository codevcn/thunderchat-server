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
import type { TMessage, TMessageFullInfo } from '../entities/message.entity'
import type { TUserId } from '@/user/user.type'
import type { UpdateProfileDto } from '@/profile/profile.dto'
import type { EHangupReason, ESDPType, EVoiceCallStatus } from '@/voice-call/voice-call.enum'
import type { TActiveVoiceCallSession } from '@/voice-call/voice-call.type'
import type { TPinMessageGroupEmitPayload } from './event.type'

export enum EListenSocketEvents {
  client_hello = 'client_hello',
  client_hello_voice_call = 'client_hello:voice_call',
  send_message_direct = 'send_message:direct',
  send_message_group = 'send_message:group',
  join_group_chat_room = 'join_group_chat_room',
  message_seen_direct = 'message_seen:direct',
  typing_direct = 'typing:direct',
  check_user_online_status = 'check_user_online_status',
  join_direct_chat_room = 'join_direct_chat_room',
  call_request = 'voice_call:request',
  call_accept = 'voice_call:accept',
  call_reject = 'voice_call:reject',
  call_offer_answer = 'voice_call:offer_answer',
  call_ice = 'voice_call:ice',
  call_hangup = 'voice_call:hangup',
  callee_set_session = 'voice_call:callee_set_session',
}

export enum EEmitSocketEvents {
  server_hello = 'server_hello',
  server_hello_voice_call = 'server_hello:voice_call',
  send_message_direct = 'send_message:direct',
  send_friend_request = 'friend_request:send',
  error = 'error',
  recovered_connection = 'recovered_connection',
  message_seen_direct = 'message_seen:direct',
  typing_direct = 'typing:direct',
  friend_request_action = 'friend_request_action',
  pin_message = 'pin_message',
  new_conversation = 'new_conversation',
  broadcast_user_online_status = 'broadcast_user_online_status',
  remove_group_chat_members = 'remove_group_chat_members',
  add_group_chat_members = 'add_group_chat_members',
  call_request = 'voice_call:request',
  send_message_group = 'send_message:group',
  update_group_chat_info = 'update_group_chat_info',
  update_user_info = 'update_user_info',
  delete_direct_chat = 'delete_direct_chat',
  delete_group_chat = 'delete_group_chat',
  member_leave_group_chat = 'member_leave_group_chat',
  pin_message_group = 'pin_message:group',
  call_ice = 'voice_call:ice',
  call_status = 'voice_call:status',
  call_offer_answer = 'voice_call:offer_answer',
  call_hangup = 'voice_call:hangup',
  call_timeout = 'voice_call:timeout',
  callee_set_session = 'callee_set_session',
}

export interface IEmitSocketEvents {
  [EEmitSocketEvents.server_hello]: (payload: string) => void
  [EEmitSocketEvents.server_hello_voice_call]: (payload: string) => void
  [EEmitSocketEvents.send_message_direct]: (payload: TGetDirectMessagesMessage) => void
  [EEmitSocketEvents.send_friend_request]: (
    payload: TUserWithProfile,
    requestData: TGetFriendRequestsData
  ) => void
  [EEmitSocketEvents.error]: (error: TWsErrorResponse) => void
  [EEmitSocketEvents.recovered_connection]: (messages: TGetDirectMessagesMessage[]) => void
  [EEmitSocketEvents.message_seen_direct]: (payload: TMsgStatusPayload) => void
  [EEmitSocketEvents.typing_direct]: (isTyping: boolean, directChatId: number) => void
  [EEmitSocketEvents.friend_request_action]: (payload: TFriendRequestPayload) => void
  [EEmitSocketEvents.pin_message]: (payload: any) => void
  [EEmitSocketEvents.new_conversation]: (
    directChat: TDirectChat | null,
    groupChat: TGroupChat | null,
    type: EChatType,
    newMessage: TMessage | null,
    sender: TUserWithProfile
  ) => void
  [EEmitSocketEvents.broadcast_user_online_status]: (
    userId: TUserId,
    onlineStatus: EUserOnlineStatus
  ) => void
  [EEmitSocketEvents.remove_group_chat_members]: (
    memberIds: number[],
    groupChat: TGroupChat
  ) => void
  [EEmitSocketEvents.add_group_chat_members]: (
    newMemberIds: number[],
    groupChat: TGroupChat
  ) => void
  [EEmitSocketEvents.call_request]: (activeCallSession: TActiveVoiceCallSession) => void
  [EEmitSocketEvents.send_message_group]: (newMessage: TMessageFullInfo) => void
  [EEmitSocketEvents.update_group_chat_info]: (
    groupChatId: number,
    groupChat: Partial<TGroupChat>
  ) => void
  [EEmitSocketEvents.update_user_info]: (
    directChatId: number,
    updatedUserId: TUserId,
    updates: UpdateProfileDto
  ) => void
  [EEmitSocketEvents.delete_direct_chat]: (directChatId: number, deleter: TUserWithProfile) => void
  [EEmitSocketEvents.delete_group_chat]: (groupChatId: number) => void
  [EEmitSocketEvents.member_leave_group_chat]: (groupChatId: number, userId: number) => void
  [EEmitSocketEvents.pin_message_group]: (payload: TPinMessageGroupEmitPayload) => void
  [EEmitSocketEvents.call_status]: (status: EVoiceCallStatus) => void
  [EEmitSocketEvents.call_offer_answer]: (SDP: string, type: ESDPType) => void
  [EEmitSocketEvents.call_ice]: (candidate: string, sdpMid?: string, sdpMLineIndex?: number) => void
  [EEmitSocketEvents.call_hangup]: (reason?: EHangupReason) => void
  [EEmitSocketEvents.call_timeout]: () => void
  [EEmitSocketEvents.callee_set_session]: () => void
}

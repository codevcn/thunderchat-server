import type { TUserWithProfile } from '@/utils/entities/user.entity'
import type { EClientSocketEvents } from './gateway.event'
import type {
  TGetDirectMessagesMessage,
  TMsgStatusPayload,
} from '@/direct-message/direct-message.type'
import type { TSuccess, TWsErrorResponse } from '@/utils/types'
import type {
  JoinGroupChatDTO,
  MarkAsSeenDTO,
  SendDirectMessageDTO,
  TypingDTO,
  CheckUserOnlineDTO,
  JoinDirectChatDTO,
} from './gateway.dto'
import type { Socket } from 'socket.io'
import type {
  TClientSocket,
  THandleCheckUserOnlineRes,
  TSendDirectMessageRes,
} from './gateway.type'
import type {
  TFriendRequestPayload,
  TGetFriendRequestsData,
} from '@/friend-request/friend-request.type'
import type { TDirectChat } from '@/utils/entities/direct-chat.entity'
import type { EChatType, EUserOnlineStatus } from '@/utils/enums'
import type { TMessage } from '@/utils/entities/message.entity'
import type { TGroupChat } from '@/utils/entities/group-chat.entity'
import type { TUserId } from '@/user/user.type'
import { UpdateProfileDto } from '@/profile/profile.dto'

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

export interface IGateway {
  handleSendDirectMessage: (
    payload: SendDirectMessageDTO,
    client: Socket<IEmitSocketEvents>
  ) => Promise<TSendDirectMessageRes>
  handleMarkAsSeenInDirectChat: (data: MarkAsSeenDTO, client: TClientSocket) => Promise<void>
  handleTyping: (data: TypingDTO, client: TClientSocket) => Promise<void>
  handleJoinGroupChat: (data: JoinGroupChatDTO, client: TClientSocket) => Promise<TSuccess>
  handleCheckUserOnlineStatus: (data: CheckUserOnlineDTO) => Promise<THandleCheckUserOnlineRes>
  handleJoinDirectChat: (data: JoinDirectChatDTO, client: TClientSocket) => Promise<TSuccess>
  broadcastAddMembersToGroupChat: (
    groupChat: TGroupChat,
    groupMemberIds: number[],
    executor: TUserWithProfile
  ) => Promise<void>
  broadcastCreateGroupChat: (
    groupChat: TGroupChat,
    groupMemberIds: number[],
    creator: TUserWithProfile
  ) => Promise<void>
  broadcastRemoveGroupChatMembers: (
    groupChat: TGroupChat,
    removedMemberIds: number[]
  ) => Promise<void>
  broadcastMemberLeaveGroupChat: (groupChatId: number, userId: number) => Promise<void>
  broadcastUpdateGroupChat: (groupChatId: number, groupChat: Partial<TGroupChat>) => Promise<void>
  broadcastUpdateUserInfo: (userId: number, updates: UpdateProfileDto) => Promise<void>
  broadcastDeleteDirectChat: (directChatId: number, deleter: TUserWithProfile) => Promise<void>
  broadcastDeleteGroupChat: (groupChatId: number) => Promise<void>
}

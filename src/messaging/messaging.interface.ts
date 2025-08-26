import type { TUserWithProfile } from '@/utils/entities/user.entity'
import type { TSuccess } from '@/utils/types'
import type {
  JoinGroupChatDTO,
  MarkAsSeenDTO,
  SendDirectMessageDTO,
  TypingDTO,
  CheckUserOnlineDTO,
  JoinDirectChatDTO,
} from './messaging.dto'
import type { Socket } from 'socket.io'
import type {
  TClientSocket,
  THandleCheckUserOnlineRes,
  TSendDirectMessageRes,
} from './messaging.type'
import type { TGroupChat } from '@/utils/entities/group-chat.entity'
import type { UpdateProfileDto } from '@/profile/profile.dto'
import type { IEmitSocketEvents } from '@/utils/events/socket.event'

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

import type { TSuccess } from '@/utils/types'
import type {
  CreateGroupChatDTO,
  CreateInviteLinkDTO,
  CreateJoinRequestDTO,
  DeleteGroupChatAvatarDTO,
  FetchGroupChatByInviteCodeDTO,
  FetchGroupChatDTO,
  FetchGroupChatPermissionsDTO,
  FetchGroupChatsDTO,
  FetchJoinRequestsDTO,
  JoinGroupByInviteLinkDTO,
  ProcessJoinRequestDTO,
  UpdateGroupChatDTO,
  UpdateGroupChatPermissionDTO,
} from './group-chat.dto'
import type {
  TFetchGroupChatData,
  TFetchGroupChatsData,
  TUploadGroupChatAvatar,
  TJoinGroupChatByInviteLink,
  TCreateNewInviteLink,
  TFetchGroupChatPermissionsRes,
} from './group-chat.type'
import type { TUser } from '@/utils/entities/user.entity'
import type {
  TGroupChat,
  TGroupJoinRequestWithUser,
  TGroupJoinRequest,
  TGroupChatWithCreator,
} from '@/utils/entities/group-chat.entity'

export interface IGroupChatsController {
  uploadGroupChatAvatar(file: Express.Multer.File): Promise<TUploadGroupChatAvatar>
  deleteGroupChatAvatar(query: DeleteGroupChatAvatarDTO): Promise<TSuccess>
  createGroupChat(body: CreateGroupChatDTO, user: TUser): Promise<TGroupChat>
  fetchGroupChat(query: FetchGroupChatDTO, user: TUser): Promise<TFetchGroupChatData>
  fetchGroupChats(query: FetchGroupChatsDTO, user: TUser): Promise<TFetchGroupChatsData[]>
  updateGroupChat(body: UpdateGroupChatDTO, user: TUser): Promise<TSuccess>
  createInviteLink(body: CreateInviteLinkDTO): Promise<TCreateNewInviteLink>
  // joinGroupChatByInviteLink(
  //   query: JoinGroupByInviteLinkDTO,
  //   user: TUser
  // ): Promise<TJoinGroupChatByInviteLink>
  updateGroupChatPermission(body: UpdateGroupChatPermissionDTO): Promise<TSuccess>
  fetchGroupChatPermissions(
    query: FetchGroupChatPermissionsDTO
  ): Promise<TFetchGroupChatPermissionsRes>
  fetchJoinRequests(query: FetchJoinRequestsDTO): Promise<TGroupJoinRequestWithUser[]>
  createJoinRequest(body: CreateJoinRequestDTO, user: TUser): Promise<TGroupJoinRequestWithUser>
  processJoinRequest(body: ProcessJoinRequestDTO): Promise<TGroupJoinRequest>
  fetchGroupChatByInviteCode(
    query: FetchGroupChatByInviteCodeDTO
  ): Promise<TGroupChatWithCreator | null>
}

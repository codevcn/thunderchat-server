import type { TSuccess } from '@/utils/types'
import type {
  CreateGroupChatDTO,
  DeleteGroupChatAvatarDTO,
  FetchGroupChatDTO,
  FetchGroupChatsDTO,
  UpdateGroupChatDTO,
} from './group-chat.dto'
import type {
  TFetchGroupChatData,
  TFetchGroupChatsData,
  TUploadGroupChatAvatar,
} from './group-chat.type'
import type { TUser } from '@/utils/entities/user.entity'
import type { TGroupChat } from '@/utils/entities/group-chat.entity'

export interface IGroupChatsController {
  uploadGroupChatAvatar(file: Express.Multer.File): Promise<TUploadGroupChatAvatar>
  deleteGroupChatAvatar(query: DeleteGroupChatAvatarDTO): Promise<TSuccess>
  createGroupChat(body: CreateGroupChatDTO, user: TUser): Promise<TGroupChat>
  fetchGroupChat(query: FetchGroupChatDTO, user: TUser): Promise<TFetchGroupChatData>
  fetchGroupChats(query: FetchGroupChatsDTO, user: TUser): Promise<TFetchGroupChatsData[]>
  updateGroupChat(body: UpdateGroupChatDTO, user: TUser): Promise<TSuccess>
}

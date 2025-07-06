import type { TSuccess } from '@/utils/types'
import type {
  CreateGroupChatDTO,
  DeleteGroupChatAvatarDTO,
  FetchGroupChatDTO,
} from './group-chat.dto'
import type { GroupChat } from '@prisma/client'
import type { TFetchGroupChatData, TUploadGroupChatAvatar } from './group-chat.type'
import type { TUser } from '@/utils/entities/user.entity'

export interface IGroupChatsController {
  uploadGroupChatAvatar(file: Express.Multer.File): Promise<TUploadGroupChatAvatar>
  deleteGroupChatAvatar(query: DeleteGroupChatAvatarDTO): Promise<TSuccess>
  createGroupChat(body: CreateGroupChatDTO): Promise<GroupChat>
  fetchGroupChat(query: FetchGroupChatDTO, user: TUser): Promise<TFetchGroupChatData>
}

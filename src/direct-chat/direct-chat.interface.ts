import { TUser } from '@/utils/entities/user.entity'
import type { FetchDirectChatDTO, FetchDirectChatsDTO } from './direct-chat.dto'
import type { TFetchDirectChatsData, TFindDirectChatData } from './direct-chat.type'

export interface IDirectChatsController {
  fetchDirectChat: (params: FetchDirectChatDTO, user: TUser) => Promise<TFindDirectChatData | null>
  fetchAllDirectChats: (query: FetchDirectChatsDTO, user: TUser) => Promise<TFetchDirectChatsData[]>
}

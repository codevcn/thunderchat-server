import type { FetchMsgsParamsDTO } from './group-message.dto'
import type { TGetGroupMessagesData } from './group-message.type'

export interface IGroupMessageController {
  fetchMessages: (groupChatId: FetchMsgsParamsDTO) => Promise<TGetGroupMessagesData>
}

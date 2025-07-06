import type { FetchMsgsParamsDTO } from './direct-message.dto'
import type { TGetDirectMessagesData } from './direct-message.type'

export interface IDirectMessageController {
  fetchMessages: (directChatId: FetchMsgsParamsDTO) => Promise<TGetDirectMessagesData>
}

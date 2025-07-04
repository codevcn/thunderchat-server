import type { TFindDirectChatData } from './direct-chat.type'

export interface IDirectChatsController {
   fetchDirectChat: (conversationId: string) => Promise<TFindDirectChatData | null>
}

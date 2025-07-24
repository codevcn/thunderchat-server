export type TGlobalSearchData = {
  users: {
    id: number
    avatarUrl?: string
    fullName?: string
  }[]
  messages: {
    id: number
    avatarUrl?: string
    conversationName: string
    messageContent: string
    highlights: string[]
  }[]
}

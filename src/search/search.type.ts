export type TGlobalSearchData = {
   users: {
      id: number
      avatarUrl?: string
      fullName?: string
      isOnline: boolean
   }[]
   messages: {
      id: number
      avatarUrl?: string
      conversationName: string
      messageContent: string
   }[]
}

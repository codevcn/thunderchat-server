import type { TGroupChat } from '@/utils/entities/group-chat.entity'
import type { TUserWithProfile } from '@/utils/entities/user.entity'
import type { TMessage } from '@/utils/entities/message.entity'

export type TFetchGroupChatData = TGroupChat

export type TUploadGroupChatAvatar = {
  avatarUrl: string
}

export type TFetchGroupChatsData = TGroupChat & {
  LastSentMessage: TMessage | null
  Creator: TUserWithProfile
}

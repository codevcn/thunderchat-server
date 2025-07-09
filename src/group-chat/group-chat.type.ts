import type { TGroupChat } from '@/utils/entities/group-chat.entity'
import type { TGroupMessage } from '@/utils/entities/group-message.entity'
import type { TUserWithProfile } from '@/utils/entities/user.entity'

export type TFetchGroupChatData = TGroupChat

export type TUploadGroupChatAvatar = {
  avatarUrl: string
}

export type TFetchGroupChatsData = TGroupChat & {
  LastSentMessage: TGroupMessage | null
  Creator: TUserWithProfile
}

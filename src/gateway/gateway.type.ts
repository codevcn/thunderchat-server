import { Socket } from 'socket.io'
import type { IEmitSocketEvents } from './gateway.interface'
import type { TUserId } from '@/user/user.type'

export type TClientSocket = Socket<{}, IEmitSocketEvents>

export type TClientAuth = {
   clientId: number
}

export type TMsgToken = string

export type TConversationTypingFlags = {
   [key: TUserId]: NodeJS.Timeout
}

export type TUserKey = {
   encryptMsgKey: string
}

import type { NextFunction } from 'express'
import type { Socket } from 'socket.io'

export type TServerMiddleware = (socket: Socket, next: NextFunction) => void

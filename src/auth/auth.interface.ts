import type { TSuccess } from '@/utils/types'
import type { Response } from 'express'
import type { CheckAuthDataDTO, LoginUserDTO } from './auth.dto'
import type { TUser } from '@/utils/entities/user.entity'

export interface IAuthController {
   login: (loginUserPayload: LoginUserDTO, res: Response) => Promise<TSuccess>
   logout: (res: Response) => Promise<TSuccess>
   // checkAuth: (user: TUser) => Promise<CheckAuthDataDTO>
}

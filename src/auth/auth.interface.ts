import type { Response } from 'express'
import type { LoginUserDTO, AdminLoginDTO, CheckAuthDataDTO, CheckAdminEmailDTO } from './auth.dto'
import type { TUserWithProfile } from '@/utils/entities/user.entity'

export interface IAuthController {
  login: (loginUserPayload: LoginUserDTO, res: Response) => Promise<{ success: boolean }>
  adminLogin: (adminLoginPayload: AdminLoginDTO, res: Response) => Promise<{ success: boolean }>
  checkAdminEmail: (
    checkAdminEmailPayload: CheckAdminEmailDTO
  ) => Promise<{ isAdmin: boolean; message?: string }>
  logout: (res: Response) => Promise<{ success: boolean }>
  checkAuth: (user: TUserWithProfile) => Promise<CheckAuthDataDTO>
  checkAdminAuth: (user: TUserWithProfile) => Promise<CheckAuthDataDTO>
}

import type { TUserWithProfile } from '@/utils/entities/user.entity'
import type { TSearchUsersData } from './user.type'
import type { TSuccess } from '@/utils/types'
import type { CreateUserDTO, GetUserByEmailDTO, SearchUsersDTO } from './user.dto'
import type { Response } from 'express'

export interface IUserController {
   register: (createUserPayload: CreateUserDTO, res: Response) => Promise<TSuccess>
   getUser: (getUserByEmailPayload: GetUserByEmailDTO) => Promise<TUserWithProfile>
   searchUsers: (searchUsersPayload: SearchUsersDTO) => Promise<TSearchUsersData[]>
}

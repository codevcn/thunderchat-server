import type { User } from '@prisma/client'
import type { TProfile } from './profile.entity'

export type TUser = User

export type TUserWithProfile = TUser & {
  Profile: Omit<TProfile, 'userId'> | null // should let it be null to check type in codes
}

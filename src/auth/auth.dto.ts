import type { TMessageOffset } from '@/direct-message/direct-message.type'
import type { TUserId } from '@/user/user.type'
import { TProfile } from '@/utils/entities/profile.entity'
import type { TUserWithProfile } from '@/utils/entities/user.entity'
import { Exclude, Type } from 'class-transformer'
import { IsDate, IsNotEmpty, IsNumber, IsOptional } from 'class-validator'

export class LoginUserDTO {
  @IsNotEmpty()
  email: string

  @IsNotEmpty()
  password: string
}

export class AdminLoginDTO {
  @IsNotEmpty()
  email: string

  @IsNotEmpty()
  password: string
}

export class CheckAdminEmailDTO {
  @IsNotEmpty()
  email: string
}

export class CheckAuthDataDTO implements TUserWithProfile {
  id: number
  createdAt: Date
  email: string
  role: import('@prisma/client').AppRole
  isActive: boolean
  inActiveAt: Date
  Profile: Omit<TProfile, 'userId'> // this prop cannot be null, if null, it is a bug

  @Exclude()
  password: string

  constructor(user: TUserWithProfile) {
    Object.assign(this, user)
  }
}

export class ClientSocketAuthDTO {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  clientId: TUserId

  @IsOptional()
  @IsDate()
  @Type(() => Number)
  messageOffset?: TMessageOffset

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  directChatId?: number

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  groupId?: number
}

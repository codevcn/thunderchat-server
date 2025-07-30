import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsIn } from 'class-validator'
import { Type } from 'class-transformer'

export class GetAdminUsersDTO {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  page: number

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  limit: number

  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsIn(['all', 'locked', 'active'])
  isLocked?: 'all' | 'locked' | 'active'
}

export class LockUnlockUserDTO {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  userId: number

  @IsNotEmpty()
  @IsBoolean()
  @Type(() => Boolean)
  isLocked: boolean
}

export class DeleteUserDTO {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  userId: number
}

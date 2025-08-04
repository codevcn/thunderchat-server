import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsIn,
  Min,
  Max,
} from 'class-validator'
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
  @IsIn(['all', 'active', 'inactive'])
  isActive?: 'all' | 'active' | 'inactive'
}

export class LockUnlockUserDTO {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  userId: number

  @IsNotEmpty()
  @IsBoolean()
  @Type(() => Boolean)
  isActive: boolean
}

export class DeleteUserDTO {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  userId: number
}

export class BanUserDTO {
  @IsNotEmpty()
  @IsString()
  reason: string
}

export class UnbanUserDTO {
  // Không cần thêm fields cho unban
}

export class GetUsersQueryDTO {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number
}

export class UpdateUserEmailDTO {
  @IsNotEmpty()
  @IsString()
  email: string
}

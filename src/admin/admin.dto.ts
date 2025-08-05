import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsIn,
  Min,
  Max,
  IsDateString,
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

export class GetSystemOverviewDTO {
  @IsOptional()
  @IsIn(['day', 'week', 'month', 'year'])
  timeRange?: 'day' | 'week' | 'month' | 'year'

  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string
}

export class GetUserMessageStatsDTO {
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
  @IsIn(['directMessageCount', 'groupMessageCount', 'totalMessageCount', 'lastMessageAt'])
  sortBy?: 'directMessageCount' | 'groupMessageCount' | 'totalMessageCount' | 'lastMessageAt'

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc'
}

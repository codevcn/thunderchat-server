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

// Violation Reports DTOs
export class GetViolationReportsDTO {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10

  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsIn(['ALL', 'PENDING', 'RESOLVED', 'DISMISSED'])
  status?: 'ALL' | 'PENDING' | 'RESOLVED' | 'DISMISSED' = 'ALL'

  @IsOptional()
  @IsIn(['ALL', 'SENSITIVE_CONTENT', 'BOTHER', 'FRAUD', 'OTHER'])
  category?: 'ALL' | 'SENSITIVE_CONTENT' | 'BOTHER' | 'FRAUD' | 'OTHER' = 'ALL'

  @IsOptional()
  @IsString()
  startDate?: string

  @IsOptional()
  @IsString()
  endDate?: string

  @IsOptional()
  @IsIn(['createdAt', 'updatedAt'])
  sortBy?: 'createdAt' | 'updatedAt' = 'createdAt'

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc'
}

export class GetViolationReportDetailDTO {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  reportId: number
}

export class UpdateViolationReportStatusDTO {
  @IsNotEmpty()
  @IsIn(['PENDING', 'RESOLVED', 'DISMISSED'])
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED'

  @IsOptional()
  @IsString()
  adminNote?: string
}

export class BanReportedUserDTO {
  @IsNotEmpty()
  @IsIn(['WARNING', 'TEMPORARY_BAN', 'PERMANENT_BAN'])
  banType: 'WARNING' | 'TEMPORARY_BAN' | 'PERMANENT_BAN'

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  banDuration?: number // Days for temporary ban

  @IsNotEmpty()
  @IsString()
  reason: string
}

export class GetUserReportHistoryDTO {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 10

  @IsNotEmpty()
  @IsIn(['reported', 'reportedBy'])
  type: 'reported' | 'reportedBy' // 'reported' = reports made by user, 'reportedBy' = reports about user
}

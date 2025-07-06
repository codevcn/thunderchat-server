import { IsOptional, IsDateString, IsNumber, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export class GetMonthlyStatsDTO {
  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  year?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  month?: number
}

export class GetUserStatsDTO {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number

  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string
}

export class GetOverallStatsDTO {
  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string
}

import { IsBoolean, IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'
import { Type } from 'class-transformer'

export class GlobalSearchPayloadDTO {
  @IsNotEmpty()
  @IsString()
  keyword: string

  @IsNotEmpty()
  @IsBoolean()
  @Type(() => Boolean)
  isFirstSearch: boolean

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  limit: number

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  messageOffsetId?: number

  @IsOptional()
  @IsString()
  @IsISO8601()
  messageOffsetCreatedAt?: string

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  userOffsetId?: number

  @IsOptional()
  @IsString()
  userOffsetFullName?: string

  @IsOptional()
  @IsString()
  userOffsetEmail?: string
}

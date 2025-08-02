import { Type } from 'class-transformer'
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsArray } from 'class-validator'

export class GetMediaMessagesDTO {
  @IsOptional()
  @IsEnum(['image', 'video', 'file', 'voice'])
  type?: 'image' | 'video' | 'file' | 'voice'

  @IsOptional()
  @IsArray()
  @IsEnum(['image', 'video', 'file', 'voice'], { each: true })
  types?: ('image' | 'video' | 'file' | 'voice')[]

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  senderId?: number

  @IsOptional()
  fromDate?: string // YYYY-MM-DD format

  @IsOptional()
  toDate?: string // YYYY-MM-DD format

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sort?: 'asc' | 'desc'
}

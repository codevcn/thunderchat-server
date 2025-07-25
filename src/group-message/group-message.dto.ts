import { Type } from 'class-transformer'
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator'
import { ESortTypes } from '@/utils/enums'
import type { TMessageOffset } from './group-message.type'
import { ToBoolean } from '@/utils/validation/transformers'

export class FetchMsgsParamsDTO {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  msgOffset: TMessageOffset

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  groupChatId: number

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  limit: number

  @IsOptional()
  @IsEnum(ESortTypes)
  sortType?: ESortTypes

  @IsNotEmpty()
  @IsBoolean()
  @ToBoolean()
  isFirstTime: boolean
}

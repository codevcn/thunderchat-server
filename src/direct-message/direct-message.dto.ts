import { Type } from 'class-transformer'
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator'
import { ESortTypes } from './direct-message.enum'
import type { TMessageOffset } from './direct-message.type'
import { ToBoolean } from '@/utils/validation/transformers'

export class FetchMsgsParamsDTO {
   @IsNumber()
   @IsOptional()
   @Type(() => Number)
   msgOffset: TMessageOffset

   @IsNumber()
   @IsNotEmpty()
   @Type(() => Number)
   directChatId: number

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

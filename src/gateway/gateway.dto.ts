import { EMessageTypes } from '@/direct-message/direct-message.enum'
import { ToBoolean } from '@/utils/validation/transformers'
import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator'

export class SendDirectMessagePayloadDTO {
  @IsNumber()
  @IsNotEmpty()
  receiverId: number

  @IsNotEmpty()
  content: string

  @IsNotEmpty()
  @IsUUID()
  token: string

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  timestamp: Date

  @IsOptional()
  mediaUrl?: string

  @IsOptional()
  fileName?: string

  @IsOptional()
  thumbnailUrl?: string

  @IsNumber()
  @Type(() => Number)
  replyToId?: number
}

export class SendDirectMessageDTO {
  @IsEnum(EMessageTypes)
  @IsNotEmpty()
  type: EMessageTypes

  @IsNotEmpty()
  @ValidateNested()
  msgPayload: SendDirectMessagePayloadDTO
}

export class MarkAsSeenDTO {
  @IsNumber()
  @IsNotEmpty()
  messageId: number

  @IsNumber()
  @IsNotEmpty()
  receiverId: number
}

export class TypingDTO {
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  receiverId: number

  @IsNotEmpty()
  @IsBoolean()
  @ToBoolean()
  isTyping: boolean

  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  directChatId: number
}

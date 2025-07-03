import { EMessageTypes } from '@/direct-message/direct-message.enum'
import { ToBoolean } from '@/utils/validation/transformers'
import { Type } from 'class-transformer'
import {
   IsBoolean,
   IsDate,
   IsEnum,
   IsNotEmpty,
   IsNumber,
   IsUUID,
   ValidateNested,
} from 'class-validator'

export class SendDirectMessagePayloadDTO {
   @IsNumber()
   @IsNotEmpty()
   receiverId: number

   @IsNotEmpty()
   content: string

   @IsNumber()
   @IsNotEmpty()
   @Type(() => Number)
   directChatId: number

   @IsNotEmpty()
   @IsUUID()
   token: string

   @IsNotEmpty()
   @IsDate()
   @Type(() => Date)
   timestamp: Date
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
   @IsNotEmpty()
   receiverId: number

   @IsNotEmpty()
   @IsBoolean()
   @ToBoolean()
   isTyping: boolean
}

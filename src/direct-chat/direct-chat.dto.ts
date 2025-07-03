import { IsNotEmpty, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'

export class FetchDirectChatDTO {
   @IsNotEmpty()
   @IsNumber()
   @Type(() => Number)
   conversationId: number
}

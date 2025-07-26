import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'
import { Type } from 'class-transformer'
import { EMessageTypes } from '@/utils/enums'

export class FetchDirectChatDTO {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  conversationId: number
}

export class FetchDirectChatsDTO {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lastId?: number

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  limit: number
}

export class FindConversationWithOtherUserDTO {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  otherUserId: number
}
export class CreateDirectChatDTO {
  recipientId: number // id của user muốn tạo chat cùng
}

import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'
import { Type } from 'class-transformer'

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

export class SearchDirectChatsDTO {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lastId?: number

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  limit: number
}

export class CreateDirectChatDTO {
  recipientId: number // id của user muốn tạo chat cùng
}

import { Type } from 'class-transformer'
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator'

export class DeleteGroupChatAvatarDTO {
  @IsString()
  avatarUrl: string
}

export class CreateGroupChatDTO {
  @IsString()
  groupName: string

  @IsArray()
  @IsNumber({}, { each: true })
  memberIds: number[]

  @IsOptional()
  @IsString()
  avatarUrl?: string
}

export class FetchGroupChatDTO {
  @IsNumber()
  @Type(() => Number)
  groupChatId: number
}

export class FetchGroupChatsDTO {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lastId?: number

  @IsNumber()
  @Type(() => Number)
  limit: number
}

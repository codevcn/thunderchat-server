import { Type } from 'class-transformer'
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator'

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

export class UpdateGroupChatDTO {
  @IsNumber()
  @Type(() => Number)
  groupChatId: number

  @IsString()
  @IsOptional()
  avatarUrl?: string

  @IsString()
  @IsOptional()
  groupName?: string
}

export class SearchGroupChatMembersDTO {
  @IsNumber()
  @Type(() => Number)
  groupChatId: number

  @IsString()
  keyword: string
}

export class CreateInviteLinkDTO {
  @IsNumber()
  @Type(() => Number)
  groupChatId: number
}

export class JoinGroupByInviteLinkDTO {
  @IsString()
  token: string
}

export class GroupChatPermissionsDTO {
  @IsBoolean()
  sendMessage: boolean

  @IsBoolean()
  pinMessage: boolean

  @IsBoolean()
  shareInviteCode: boolean

  @IsBoolean()
  updateInfo: boolean
}

export class UpdateGroupChatPermissionDTO {
  @IsNumber()
  @Type(() => Number)
  groupChatId: number

  @ValidateNested()
  @Type(() => GroupChatPermissionsDTO)
  permissions: GroupChatPermissionsDTO
}

export class FetchGroupChatPermissionsDTO {
  @IsNumber()
  @Type(() => Number)
  groupChatId: number
}

import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator'

export class GetFriendsDTO {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  userId: number

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  limit: number

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lastFriendId?: number

  @IsOptional()
  search?: string // Thêm trường search để hỗ trợ tìm kiếm
}

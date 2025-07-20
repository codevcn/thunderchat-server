import { Type } from 'class-transformer'
import { IsNumber } from 'class-validator'

export class FetchGroupChatMembersDTO {
  @IsNumber()
  @Type(() => Number)
  groupChatId: number
}

export class RemoveGroupChatMemberDTO {
  @IsNumber()
  @Type(() => Number)
  groupChatId: number

  @IsNumber()
  @Type(() => Number)
  memberId: number
}

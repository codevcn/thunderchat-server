import { Type } from 'class-transformer'
import { IsNumber } from 'class-validator'

export class FetchGroupChatMembersDTO {
  @IsNumber()
  @Type(() => Number)
  groupChatId: number
}

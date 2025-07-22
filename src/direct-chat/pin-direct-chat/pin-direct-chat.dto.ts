import { Type } from 'class-transformer'
import { IsBoolean, IsNotEmpty, IsNumber } from 'class-validator'

export class PinDirectChatDTO {
  // DTO cho request ghim/bỏ ghim cuộc trò chuyện
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  directChatId: number // ID của cuộc trò chuyện cần ghim/bỏ ghim

  @IsBoolean()
  @IsNotEmpty()
  @Type(() => Boolean)
  isPinned: boolean // Trạng thái ghim (true: ghim, false: bỏ ghim)
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { StickersService } from './stickers.service'
import { GetStickersDTO } from './sticker.dto'
import { ERoutes } from '@/utils/enums'
import { IStickerController } from './sticker.interface'
import { AuthGuard } from '@/auth/auth.guard'

@Controller(ERoutes.STICKER)
@UseGuards(AuthGuard)
export class StickerController implements IStickerController {
   constructor(private stickersService: StickersService) {}

   @Get('get-stickers')
   async getStickers(@Query() payload: GetStickersDTO) {
      const { categoryId, offsetId } = payload
      return await this.stickersService.getStickersByCategoryId(categoryId, offsetId)
   }

   @Get('get-all-categories')
   async getAllStickerCategories() {
      return await this.stickersService.getAllStickerCategories()
   }

   @Get('get-greeting-sticker')
   async getGreetingSticker() {
      return await this.stickersService.getGreetingSticker()
   }
}

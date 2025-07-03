import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { SearchService } from './search.service'
import type { ISearchController } from './search.interface'
import { GlobalSearchPayloadDTO } from './search.dto'
import { User } from '@/user/user.decorator'
import type { TUser } from '@/utils/entities/user.entity'
import { AuthGuard } from '@/auth/auth.guard'
import { ERoutes } from '@/utils/enums'

@Controller(ERoutes.SEARCH)
@UseGuards(AuthGuard)
export class SearchController implements ISearchController {
   constructor(private readonly searchService: SearchService) {}

   @Get('global-search')
   async searchGlobally(@Query() searchPayload: GlobalSearchPayloadDTO, @User() user: TUser) {
      const { keyword } = searchPayload
      return await this.searchService.searchGlobally(keyword, user.id)
   }
}

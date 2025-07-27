import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common'
import { SearchService } from './search.service'
import type { ISearchController } from './search.interface'
import { GlobalSearchPayloadDTO } from './search.dto'
import { User } from '@/user/user.decorator'
import type { TUserWithProfile } from '@/utils/entities/user.entity'
import { AuthGuard } from '@/auth/auth.guard'
import { ERoutes } from '@/utils/enums'

@Controller(ERoutes.SEARCH)
@UseGuards(AuthGuard)
export class SearchController implements ISearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('global-search')
  async searchGlobally(
    @Body() searchPayload: GlobalSearchPayloadDTO,
    @User() user: TUserWithProfile
  ) {
    const { keyword, messageSearchOffset, userSearchOffset, limit } = searchPayload
    const searchResult = await this.searchService.searchGlobally(
      keyword,
      user.id,
      limit,
      user.id,
      messageSearchOffset,
      userSearchOffset
    )
    return searchResult
  }
}

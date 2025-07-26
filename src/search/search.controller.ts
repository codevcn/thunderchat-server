import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { SearchService } from './search.service'
import type { ISearchController } from './search.interface'
import { GlobalSearchPayloadDTO } from './search.dto'
import { User } from '@/user/user.decorator'
import type { TUserWithProfile } from '@/utils/entities/user.entity'
import { AuthGuard } from '@/auth/auth.guard'
import { ERoutes } from '@/utils/enums'
import { DevLogger } from '@/dev/dev-logger'

@Controller(ERoutes.SEARCH)
@UseGuards(AuthGuard)
export class SearchController implements ISearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('global-search')
  async searchGlobally(
    @Body() searchPayload: GlobalSearchPayloadDTO,
    @User() user: TUserWithProfile
  ) {
    const {
      keyword,
      messageOffsetId,
      messageOffsetCreatedAt,
      userOffsetId,
      userOffsetFullName,
      userOffsetEmail,
      isFirstSearch,
      limit,
    } = searchPayload
    DevLogger.logInfo('searchPayload:', searchPayload)
    if (isFirstSearch) {
      return await this.searchService.searchGlobally(
        keyword,
        user.id,
        isFirstSearch,
        limit,
        user.id,
        undefined,
        undefined
      )
    }
    const searchResult = await this.searchService.searchGlobally(
      keyword,
      user.id,
      isFirstSearch,
      limit,
      user.id,
      messageOffsetId && messageOffsetCreatedAt
        ? { id: messageOffsetId.toString(), created_at: messageOffsetCreatedAt }
        : undefined,
      userOffsetId && userOffsetFullName && userOffsetEmail
        ? { id: userOffsetId.toString(), full_name: userOffsetFullName, email: userOffsetEmail }
        : undefined
    )
    return searchResult
  }
}

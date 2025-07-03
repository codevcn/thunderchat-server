import type { TUser } from '@/utils/entities/user.entity'
import type { GlobalSearchPayloadDTO } from './search.dto'
import type { TGlobalSearchData } from './search.type'

export interface ISearchController {
   searchGlobally(searchPayload: GlobalSearchPayloadDTO, user: TUser): Promise<TGlobalSearchData>
}

import type { TUser } from '@/utils/entities/user.entity'
import type { TRequestWithUser } from '@/utils/types'
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const User = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
   const request = ctx.switchToHttp().getRequest<TRequestWithUser>()
   return request.user satisfies TUser
})

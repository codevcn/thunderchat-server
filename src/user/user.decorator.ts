import type { TUser } from '@/utils/entities/user.entity'
import type { TRequestWithUser } from '@/utils/types'
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const User = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<TRequestWithUser>()
  const user = request.user satisfies TUser

  if (data) {
    return user[data as keyof TUser]
  }

  return user
})

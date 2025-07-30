import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common'
import { PrismaService } from '../configs/db/prisma.service'
import { EProviderTokens } from '@/utils/enums'

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(@Inject(EProviderTokens.PRISMA_CLIENT) private prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user) {
      throw new ForbiddenException('User not authenticated')
    }

    // Check if user is admin (you can customize this logic)
    // For now, we'll check if email is trung@gmail.com
    if (user.email !== 'trung@gmail.com') {
      throw new ForbiddenException('Access denied. Admin privileges required.')
    }

    return true
  }
}

import { Injectable, Inject } from '@nestjs/common'
import { EProviderTokens } from '@/utils/enums'
import { PrismaService } from '@/configs/db/prisma.service'
import { UpdateProfileDto } from './profile.dto'

@Injectable()
export class ProfileService {
  constructor(
    @Inject(EProviderTokens.PRISMA_CLIENT)
    private prisma: PrismaService
  ) {}

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const data = { ...dto }
    if (
      data.birthday &&
      typeof data.birthday === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(data.birthday)
    ) {
      data.birthday = new Date(data.birthday).toISOString()
    }
    if (data.birthday === '' || !data.birthday) {
      delete data.birthday
    }
    return this.prisma.profile.update({
      where: { userId },
      data,
    })
  }

  async getProfile(userId: number) {
    return this.prisma.profile.findUnique({ where: { userId } })
  }
}

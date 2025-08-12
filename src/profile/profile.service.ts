import { Injectable, Inject } from '@nestjs/common'
import { EInternalEvents, EProviderTokens } from '@/utils/enums'
import { PrismaService } from '@/configs/db/prisma.service'
import { UpdateProfileDto } from './profile.dto'
import { EventEmitter2 } from '@nestjs/event-emitter'

@Injectable()
export class ProfileService {
  constructor(
    @Inject(EProviderTokens.PRISMA_CLIENT)
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2
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
    this.eventEmitter.emit(EInternalEvents.UPDATE_USER_INFO, userId, dto)
    return this.prisma.profile.update({
      where: { userId },
      data,
    })
  }

  async getProfile(userId: number) {
    return this.prisma.profile.findUnique({ where: { userId } })
  }
}

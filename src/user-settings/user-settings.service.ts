import { Injectable } from '@nestjs/common'
import { PrismaService } from '../configs/db/prisma.service'
import { UpdateUserSettingsDto } from './user-settings.dto'

@Injectable()
export class UserSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async updateOnlyReceiveFriendMessage(userId: number, dto: UpdateUserSettingsDto) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      update: { onlyReceiveFriendMessage: dto.onlyReceiveFriendMessage },
      create: { userId, onlyReceiveFriendMessage: dto.onlyReceiveFriendMessage },
    })
  }

  async getUserSettings(userId: number) {
    let settings = await this.prisma.userSettings.findUnique({ where: { userId } })
    if (!settings) {
      settings = await this.prisma.userSettings.create({
        data: { userId, onlyReceiveFriendMessage: false },
      })
    }
    return settings
  }
}

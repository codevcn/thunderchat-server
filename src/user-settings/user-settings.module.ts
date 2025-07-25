import { Module } from '@nestjs/common'
import { UserSettingsService } from './user-settings.service'
import { UserSettingsController } from './user-settings.controller'
import { PrismaService } from '../configs/db/prisma.service'
import { AuthModule } from '../auth/auth.module'
import { UserModule } from '../user/user.module'

@Module({
  imports: [AuthModule, UserModule],
  providers: [UserSettingsService, PrismaService],
  controllers: [UserSettingsController],
  exports: [UserSettingsService],
})
export class UserSettingsModule {}

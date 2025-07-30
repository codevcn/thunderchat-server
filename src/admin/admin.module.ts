import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { AdminGuard } from './admin.guard'
import { PrismaModule } from '../configs/db/prisma.module'
import { AuthModule } from '@/auth/auth.module'
import { UserModule } from '@/user/user.module'

@Module({
  imports: [PrismaModule, AuthModule, UserModule],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService, AdminGuard],
})
export class AdminModule {}

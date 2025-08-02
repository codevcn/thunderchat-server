import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { PrismaModule } from '@/configs/db/prisma.module'
import { UserModule } from '@/user/user.module'

@Module({
  imports: [PrismaModule, UserModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

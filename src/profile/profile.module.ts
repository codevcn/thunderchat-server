import { Module } from '@nestjs/common'
import { ProfileController } from './profile.controller'
import { ProfileService } from './profile.service'
import { PrismaModule } from '../configs/db/prisma.module'
import { JwtModule } from '@nestjs/jwt'
import { UserModule } from '../user/user.module'

@Module({
  imports: [
    PrismaModule, // Để inject PrismaService qua provider token
    JwtModule, // Để inject JWTService cho AuthGuard
    UserModule, // Để inject UserService cho AuthGuard
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}

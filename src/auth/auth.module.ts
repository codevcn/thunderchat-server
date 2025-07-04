import { Module } from '@nestjs/common'
import { AuthController } from '@/auth/auth.controller'
import { AuthService } from '@/auth/auth.service'
import { JWTService } from '@/auth/jwt/jwt.service'
import { CredentialService } from './credentials/credentials.service'
import { UserModule } from '@/user/user.module'

@Module({
   imports: [UserModule],
   controllers: [AuthController],
   providers: [AuthService, JWTService, CredentialService],
})
export class AuthModule {}

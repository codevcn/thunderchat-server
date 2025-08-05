import { Module } from '@nestjs/common'
import { AuthController } from '@/auth/auth.controller'
import { AuthService } from '@/auth/auth.service'
import { JWTService } from '@/auth/jwt/jwt.service'
import { CredentialService } from './credentials/credentials.service'
import { UserModule } from '@/user/user.module'
import { AuthGuard } from './auth.guard'
import { AdminRoleModule } from './role/admin/admin.module'
import { SocketService } from '@/gateway/socket/socket.service'

@Module({
  imports: [UserModule, AdminRoleModule],
  controllers: [AuthController],
  providers: [AuthService, JWTService, CredentialService, AuthGuard, SocketService],
  exports: [AuthService, JWTService, CredentialService, SocketService],
})
export class AuthModule {}

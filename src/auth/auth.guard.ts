import { Request } from 'express'
import { EClientCookieNames } from '@/utils/enums'
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import type { TJWTPayload } from './auth.type'
import { JWTService } from './jwt/jwt.service'
import { UserService } from '@/user/user.service'
import { EAuthMessages } from './auth.message'

@Injectable()
export class AuthGuard implements CanActivate {
   constructor(
      private jwtService: JWTService,
      private userService: UserService
   ) {}

   async canActivate(context: ExecutionContext): Promise<boolean> {
      await this.authenticateUser(context)
      return true
   }

   private async authenticateUser(context: ExecutionContext): Promise<void> {
      const req = context.switchToHttp().getRequest<Request>()
      const token = this.extractToken(req)

      if (!token) {
         throw new UnauthorizedException(EAuthMessages.TOKEN_NOT_FOUND)
      }

      let payload: TJWTPayload
      try {
         payload = await this.jwtService.verifyToken(token)
      } catch (error) {
         throw new UnauthorizedException(EAuthMessages.AUTHENTICATION_FAILED)
      }
      const user = await this.userService.findById(payload.user_id)

      req['user'] = user
   }

   private extractToken(req: Request): string | undefined {
      return req.cookies[EClientCookieNames.JWT_TOKEN_AUTH] || undefined
   }
}

import { EClientCookieNames } from '@/utils/enums'
import { Inject, Injectable, NestMiddleware } from '@nestjs/common'
import type { Request, Response, NextFunction } from 'express'
import { ClientGrpc } from '@nestjs/microservices'
import { EGrpcPackages, EGrpcServices } from '@/utils/enums'
import { AuthService } from '@/configs/communication/grpc/services/auth.service'

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private authService: AuthService

  constructor(@Inject(EGrpcPackages.AUTH_PACKAGE) private authClient: ClientGrpc) {
    this.authService = new AuthService(this.authClient.getService(EGrpcServices.AUTH_SERVICE))
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const token = this.extractToken(req)
    if (!token) return next()

    const user = await this.authService.verifyToken(token)
    req.user = user

    next()
  }

  private extractToken(req: Request): string | undefined {
    return req.cookies[EClientCookieNames.JWT_TOKEN_AUTH] || undefined
  }
}

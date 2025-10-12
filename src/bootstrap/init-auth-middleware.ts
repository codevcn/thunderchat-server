import type { IAPIGatewayRouting } from '@/app.interface'
import { EAuthMessages } from '@/auth/auth.message'
import { AuthService } from '@/configs/communication/grpc/services/auth.service'
import { EClientCookieNames, EGrpcPackages, EGrpcServices } from '@/utils/enums'
import { loadJSONFileSync } from '@/utils/helpers'
import { UnauthorizedException } from '@nestjs/common'
import { ClientProxyFactory, Transport } from '@nestjs/microservices'
import { NestExpressApplication } from '@nestjs/platform-express'
import type { NextFunction, Request, Response } from 'express'
import { join } from 'path'

export const initAuthMiddleware = (app: NestExpressApplication, apiPrefix: string) => {
  const config = loadJSONFileSync<IAPIGatewayRouting>(
    join(__dirname, '/../../../assets/auth/', 'guarded-routes.json')
  )
  if (!config) return

  const { AUTH_SERVICE_PORT } = process.env

  const authService = new AuthService(
    ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: EGrpcPackages.AUTH,
        protoPath: join(__dirname, '../../protos/artifacts/', 'auth.proto'),
        url: `localhost:${AUTH_SERVICE_PORT}`,
      },
    }).getService(EGrpcServices.AUTH_SERVICE)
  )

  const { services } = config
  for (const serviceName in services) {
    const { routes } = services[serviceName]
    for (const { path } of routes) {
      app.use(`/${apiPrefix}${path}`, async (req: Request, res: Response, next: NextFunction) => {
        const token = req.cookies[EClientCookieNames.JWT_TOKEN_AUTH] || undefined
        if (!token) {
          return next(new UnauthorizedException(EAuthMessages.TOKEN_NOT_FOUND))
        }
        try {
          const user = await authService.verifyToken(token)
          req.user = user
          next()
        } catch (error) {
          return next(new UnauthorizedException(EAuthMessages.INVALID_TOKEN))
        }
      })
    }
  }
}

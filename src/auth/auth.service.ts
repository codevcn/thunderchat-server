import { Injectable, UnauthorizedException } from '@nestjs/common'
import { UserService } from '@/user/user.service'
import { JWTService } from './jwt/jwt.service'
import { CredentialService } from './credentials/credentials.service'
import { Response } from 'express'
import type { TLoginUserParams } from './auth.type'
import { Socket } from 'socket.io'
import { EClientCookieNames } from '@/utils/enums'
import type { TClientCookie } from '@/utils/types'
import * as cookie from 'cookie'
import { EAuthMessages } from '@/auth/auth.message'
import { BaseWsException } from '@/utils/exceptions/base-ws.exception'
import { EValidationMessages } from '@/utils/messages'
import { ClientSocketAuthDTO } from './auth.dto'
import type { TClientSocket } from '@/gateway/gateway.type'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { SystemException } from '@/utils/exceptions/system.exception'

@Injectable()
export class AuthService {
   constructor(
      private jwtService: JWTService,
      private userService: UserService,
      private credentialService: CredentialService
   ) {}

   async loginUser(res: Response, { email, password }: TLoginUserParams): Promise<void> {
      const user = await this.userService.getUserByEmail(email)

      const isMatch = await this.credentialService.compareHashedPassword(password, user.password)
      if (!isMatch) {
         throw new UnauthorizedException(EAuthMessages.INCORRECT_EMAIL_PASSWORD)
      }

      const { jwt_token } = await this.jwtService.createJWT({
         email: user.email,
         user_id: user.id,
      })

      await this.jwtService.sendClientJWT({
         response: res,
         token: jwt_token,
      })
   }

   async logoutUser(res: Response): Promise<void> {
      await this.jwtService.removeJWT({ response: res })
   }

   async validateSocketConnection(socket: Socket): Promise<void> {
      const clientCookie = socket.handshake.headers.cookie
      if (!clientCookie) {
         throw new SystemException(EAuthMessages.INVALID_CREDENTIALS)
      }
      const parsed_cookie = cookie.parse(clientCookie) as TClientCookie
      const jwt = parsed_cookie[EClientCookieNames.JWT_TOKEN_AUTH]
      try {
         await this.jwtService.verifyToken(jwt)
      } catch (error) {
         throw new SystemException(EAuthMessages.AUTHENTICATION_FAILED)
      }
   }

   async validateSocketAuth(clientSocket: TClientSocket): Promise<ClientSocketAuthDTO> {
      console.log('>>> socket.auth:', clientSocket.handshake.auth)
      const socketAuth = plainToInstance(ClientSocketAuthDTO, clientSocket.handshake.auth)
      const errors = await validate(socketAuth)
      console.log('>>> errors:', errors)
      if (errors && errors.length > 0) {
         throw new BaseWsException(EValidationMessages.INVALID_INPUT)
      }
      return socketAuth
   }
}

import type { TJWTPayload, TSendJWTParams, TRemoveJWTParams } from '../auth.type'
import { JwtService } from '@nestjs/jwt'
import { EClientCookieNames } from '@/utils/enums'
import { Injectable } from '@nestjs/common'
import ms from 'ms'
import type { TJWTToken } from '@/utils/types'
import type { CookieOptions } from 'express'

@Injectable()
export class JWTService {
   private jwtCookieOptions = {
      maxAge: ms(process.env.JWT_TOKEN_MAX_AGE_IN_HOUR),
      domain: process.env.CLIENT_DOMAIN_DEV,
      path: '/',
      httpOnly: true,
      secure: true,
   }

   constructor(private jwtService: JwtService) {}

   getJWTcookieOtps(): CookieOptions {
      return this.jwtCookieOptions
   }

   async createJWT(payload: TJWTPayload): Promise<TJWTToken> {
      return {
         jwt_token: await this.jwtService.signAsync(payload),
      }
   }

   async verifyToken(token: string): Promise<TJWTPayload> {
      return await this.jwtService.verifyAsync<TJWTPayload>(token, {
         secret: process.env.JWT_SECRET,
      })
   }

   async sendClientJWT({ response, token, cookie_otps }: TSendJWTParams): Promise<void> {
      response.cookie(
         EClientCookieNames.JWT_TOKEN_AUTH,
         token,
         cookie_otps || this.getJWTcookieOtps()
      )
   }

   async removeJWT({ response, cookie_otps }: TRemoveJWTParams): Promise<void> {
      response.clearCookie(
         EClientCookieNames.JWT_TOKEN_AUTH,
         cookie_otps || this.getJWTcookieOtps()
      )
   }
}

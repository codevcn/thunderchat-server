import type { TJWTPayload, TSendJWTParams, TRemoveJWTParams } from '../auth.type'
import { JwtService } from '@nestjs/jwt'
import { EClientCookieNames } from '@/utils/enums'
import { Injectable } from '@nestjs/common'
import ms from 'ms'
import type { TJWTToken } from '@/utils/types'
import type { CookieOptions } from 'express'
import type { TJWTCookieOptions } from './jwt.type'

@Injectable()
export class JWTService {
  private jwtCookieOptions: TJWTCookieOptions

  constructor(private jwtService: JwtService) {
    console.log('>>> process env:', {
      CLIENT_DOMAIN_DEV: process.env.CLIENT_DOMAIN_DEV,
      CLIENT_DOMAIN: process.env.CLIENT_DOMAIN,
    })
    this.jwtCookieOptions = {
      httpOnly: true, // bảo mật, JS không truy cập được
      secure: false, // dev trên LAN không có https -> để false
      sameSite: 'lax', // cho phép gửi cookie qua cùng domain/IP (hạn chế CSRF cơ bản)
      path: '/', // cookie áp dụng toàn bộ site
      // domain: "192.168.1.5", // thường không cần set domain trong LAN, để trống là ổn
      maxAge: ms(process.env.JWT_TOKEN_MAX_AGE_IN_HOUR),
    }
  }

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
    const opts = { ...(cookie_otps || this.getJWTcookieOtps()) }
    delete opts.maxAge
    delete opts.expires
    response.clearCookie(EClientCookieNames.JWT_TOKEN_AUTH, opts)
  }
}

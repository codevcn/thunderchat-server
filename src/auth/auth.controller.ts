import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  Get,
  UseInterceptors,
  ClassSerializerInterceptor,
  InternalServerErrorException,
} from '@nestjs/common'
import { ERoutes } from '@/utils/enums'
import { CheckAuthDataDTO, LoginUserDTO } from '@/auth/auth.dto'
import { AuthService } from '@/auth/auth.service'
import type { Response } from 'express'
import { AuthGuard } from '@/auth/auth.guard'
import type { IAuthController } from './auth.interface'
import { User } from '@/user/user.decorator'
import { TUserWithProfile } from '@/utils/entities/user.entity'
import { UserService } from '@/user/user.service'

@Controller(ERoutes.AUTH)
export class AuthController implements IAuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  @Post('login')
  async login(@Body() loginUserPayload: LoginUserDTO, @Res({ passthrough: true }) res: Response) {
    await this.authService.loginUser(res, loginUserPayload)
    return { success: true }
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Res({ passthrough: true }) res: Response) {
    await this.authService.logoutUser(res)
    return { success: true }
  }

  @Get('check-auth')
  @UseGuards(AuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async checkAuth(@User() user: TUserWithProfile) {
    return new CheckAuthDataDTO(user)
  }
}

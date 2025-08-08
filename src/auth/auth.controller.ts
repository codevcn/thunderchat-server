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
  UnauthorizedException,
} from '@nestjs/common'
import { ERoutes } from '@/utils/enums'
import { CheckAuthDataDTO, LoginUserDTO, AdminLoginDTO, CheckAdminEmailDTO } from '@/auth/auth.dto'
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

  @Post('admin/login')
  async adminLogin(
    @Body() adminLoginPayload: AdminLoginDTO,
    @Res({ passthrough: true }) res: Response
  ) {
    await this.authService.loginAdmin(res, adminLoginPayload)
    return { success: true }
  }

  @Post('admin/check-email')
  async checkAdminEmail(@Body() checkAdminEmailPayload: CheckAdminEmailDTO) {
    const result = await this.authService.checkAdminEmail(checkAdminEmailPayload.email)
    return result
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Res({ passthrough: true }) res: Response, @User() user: TUserWithProfile) {
    await this.authService.logoutUser(res, user.id)
    return { success: true }
  }

  @Post('admin/logout')
  @UseGuards(AuthGuard)
  async adminLogout(@Res({ passthrough: true }) res: Response, @User() user: TUserWithProfile) {
    await this.authService.adminLogout(res, user.id)
    return { success: true }
  }

  @Get('check-auth')
  @UseGuards(AuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async checkAuth(@User() user: TUserWithProfile): Promise<CheckAuthDataDTO> {
    return new CheckAuthDataDTO(user)
  }

  @Get('admin/check-auth')
  @UseGuards(AuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async checkAdminAuth(@User() user: TUserWithProfile): Promise<CheckAuthDataDTO> {
    // Kiểm tra role ADMIN
    if (user.role !== 'ADMIN') {
      throw new UnauthorizedException('Admin access required')
    }
    return new CheckAuthDataDTO(user)
  }
}

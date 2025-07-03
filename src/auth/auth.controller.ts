import {
   Controller,
   Post,
   Body,
   Res,
   UseGuards,
   Get,
   UseInterceptors,
   ClassSerializerInterceptor,
} from '@nestjs/common'
import { ERoutes } from '@/utils/enums'
import { CheckAuthDataDTO, LoginUserDTO } from '@/auth/auth.dto'
import { AuthService } from '@/auth/auth.service'
import type { Response } from 'express'
import { AuthGuard } from '@/auth/auth.guard'
import type { IAuthController } from './auth.interface'
import { User } from '@/user/user.decorator'
import { TUser } from '@/utils/entities/user.entity'

@Controller(ERoutes.AUTH)
export class AuthController implements IAuthController {
   constructor(private authService: AuthService) {}

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
   async checkAuth(@User() user: TUser) {
      return new CheckAuthDataDTO(user)
   }
}

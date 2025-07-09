import { Controller, Put, Body, UseGuards, Req, Get } from '@nestjs/common'
import { ProfileService } from './profile.service'
import { UpdateProfileDto } from './profile.dto'
import { AuthGuard } from '@/auth/auth.guard'
import { ERoutes } from '@/utils/enums'
import { Request } from 'express'

@Controller(ERoutes.PROFILE)
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Put('update')
  async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const userId = (req as any).user.id
    return this.profileService.updateProfile(userId, dto)
  }

  @Get()
  async getProfile(@Req() req) {
    const userId = req.user.id
    return this.profileService.getProfile(userId)
  }
}

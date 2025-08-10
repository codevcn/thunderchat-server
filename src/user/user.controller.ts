import { Body, Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common'
import {
  ChangePasswordDTO,
  BlockUserDTO,
  CreateUserDTO,
  GetUserByEmailDTO,
  CheckBlockedUserDTO,
  SearchUsersDTO,
  UnblockUserDTO,
} from '@/user/user.dto'
import { UserService } from '@/user/user.service'
import { ERoutes } from '@/utils/enums'
import { JWTService } from '@/auth/jwt/jwt.service'
import type { Response } from 'express'
import type { IUserController } from './user.interface'
import { AuthGuard } from '@/auth/auth.guard'
import { User } from './user.decorator'
import { BlockUserService } from '@/user/block-user.service'
import { TUserWithProfile } from '@/utils/entities/user.entity'

@Controller(ERoutes.USER)
export class UserController implements IUserController {
  constructor(
    private userService: UserService,
    private jwtService: JWTService,
    private blockUserService: BlockUserService
  ) {}

  @Post('register')
  async register(
    @Body() createUserPayload: CreateUserDTO,
    @Res({ passthrough: true }) res: Response
  ) {
    const { jwt_token } = await this.userService.registerUser(createUserPayload)

    await this.jwtService.sendClientJWT({
      response: res,
      token: jwt_token,
    })

    return { success: true }
  }

  @Get('get-user')
  async getUser(@Query() getUserByEmailPayload: GetUserByEmailDTO) {
    return await this.userService.getUserByEmail(getUserByEmailPayload.email)
  }

  @Get('search-users')
  @UseGuards(AuthGuard)
  async searchUsers(@Query() searchUsersPayload: SearchUsersDTO) {
    return await this.userService.searchUsers(searchUsersPayload)
  }

  @Post('change-password')
  @UseGuards(AuthGuard)
  async changePassword(@User() user: TUserWithProfile, @Body() dto: ChangePasswordDTO) {
    await this.userService.changePassword(user.id, dto.oldPassword, dto.newPassword)
    return { success: true }
  }

  @Post('block-user')
  @UseGuards(AuthGuard)
  async blockUser(@User() user: TUserWithProfile, @Body() dto: BlockUserDTO) {
    await this.blockUserService.blockUser(user.id, dto.blockedUserId, dto.blockType)
    return { success: true }
  }

  @Get('check-blocked-user')
  @UseGuards(AuthGuard)
  async checkBlockedUser(@User() user: TUserWithProfile, @Query() dto: CheckBlockedUserDTO) {
    return await this.blockUserService.checkBlockedUser(user.id, dto.otherUserId)
  }

  @Post('unblock-user')
  @UseGuards(AuthGuard)
  async unblockUser(@User() user: TUserWithProfile, @Body() dto: UnblockUserDTO) {
    await this.blockUserService.unblockUser(user.id, dto.blockedUserId)
    return { success: true }
  }
}

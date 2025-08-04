import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common'
import { AuthGuard } from '@/auth/auth.guard'
import { AdminGuard, AdminOnly } from '@/auth/role/admin'
import { AdminService } from './admin.service'
import { BanUserDTO, GetAdminUsersDTO, LockUnlockUserDTO, UpdateUserEmailDTO } from './admin.dto'

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @AdminOnly()
  async getUsers(@Query() params: GetAdminUsersDTO) {
    return await this.adminService.getUsers(params)
  }

  @Put('/users/lock-unlock')
  @AdminOnly()
  async lockUnlockUser(@Body() body: LockUnlockUserDTO) {
    return await this.adminService.lockUnlockUser(body.userId, body.isActive)
  }

  @Put('/users/:id/email')
  @AdminOnly()
  async updateUserEmail(
    @Param('id', ParseIntPipe) userId: number,
    @Body() body: UpdateUserEmailDTO
  ) {
    return await this.adminService.updateUserEmail(userId, body.email)
  }
}

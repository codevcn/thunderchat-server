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
import { BanUserDTO, GetAdminUsersDTO, LockUnlockUserDTO } from './admin.dto'

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @AdminOnly()
  async getDashboard() {
    return await this.adminService.getDashboardStats()
  }

  @Get('system-stats')
  @AdminOnly()
  async getSystemStats() {
    return await this.adminService.getSystemStats()
  }

  @Put('users/:id/ban')
  @AdminOnly()
  async banUser(@Param('id', ParseIntPipe) userId: number, @Body() banUserData: BanUserDTO) {
    return await this.adminService.banUser(userId, banUserData.reason)
  }

  @Put('users/:id/unban')
  @AdminOnly()
  async unbanUser(@Param('id', ParseIntPipe) userId: number) {
    return await this.adminService.unbanUser(userId)
  }

  @Delete('users/:id')
  @AdminOnly()
  async deleteUser(@Param('id', ParseIntPipe) userId: number) {
    return await this.adminService.deleteUser(userId)
  }

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
}

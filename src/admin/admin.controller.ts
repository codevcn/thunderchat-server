import { Controller, Get, Put, Delete, Query, Body, UseGuards } from '@nestjs/common'
import { AdminService } from './admin.service'
import { GetAdminUsersDTO, LockUnlockUserDTO, DeleteUserDTO } from './admin.dto'
import { AuthGuard } from '@/auth/auth.guard'
import { AdminGuard } from './admin.guard'
import type { IAdminController } from './admin.interface'

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController implements IAdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  async getUsers(@Query() params: GetAdminUsersDTO) {
    return await this.adminService.getUsers(params)
  }

  @Put('users/lock-unlock')
  async lockUnlockUser(@Body() params: LockUnlockUserDTO) {
    return await this.adminService.lockUnlockUser(params)
  }

  @Delete('users')
  async deleteUser(@Body() params: DeleteUserDTO) {
    return await this.adminService.deleteUser(params)
  }
}

import { Injectable, Inject } from '@nestjs/common'
import { PrismaService } from '@/configs/db/prisma.service'
import { UserService } from '@/user/user.service'
import { EProviderTokens, EAppRoles } from '@/utils/enums'
import { TAdminUsersData, TGetAdminUsersParams } from './admin.type'

@Injectable()
export class AdminService {
  constructor(
    @Inject(EProviderTokens.PRISMA_CLIENT)
    private prisma: PrismaService,
    private userService: UserService
  ) {}

  async getDashboardStats() {
    const totalUsers = await this.prisma.user.count()

    return {
      summary: {
        totalUsers,
        message: 'Dashboard loaded successfully',
      },
    }
  }

  async getAllUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        include: {
          Profile: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count(),
    ])

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async banUser(userId: number, reason: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.role === 'ADMIN') {
      throw new Error('Cannot ban admin user')
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        inActiveAt: new Date(),
      },
    })

    // Log ban action (có thể tạo bảng admin_logs sau)
    console.log(`User ${userId} banned for: ${reason}`)

    return { success: true, message: 'User banned successfully' }
  }

  async unbanUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true,
        inActiveAt: new Date(),
      },
    })

    return { success: true, message: 'User unbanned successfully' }
  }

  async deleteUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.role === 'ADMIN') {
      throw new Error('Cannot delete admin user')
    }

    // Soft delete - chỉ đánh dấu là deleted
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        inActiveAt: new Date(),
      },
    })

    return { success: true, message: 'User deleted successfully' }
  }

  async getSystemStats() {
    const totalUsers = await this.prisma.user.count()
    const activeUsers = await this.prisma.user.count({ where: { isActive: true } })

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
      },
      message: 'System stats loaded successfully',
    }
  }

  async getUsers(params: TGetAdminUsersParams): Promise<TAdminUsersData> {
    const { page, limit, search, isActive } = params

    // Build where clause for filtering
    const where: any = {
      role: EAppRoles.USER, // Only get users with role USER
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { Profile: { fullName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (isActive && isActive !== 'all') {
      where.isActive = isActive === 'active'
    }

    // Count total items for pagination
    const totalItems = await this.prisma.user.count({ where })

    // Calculate pagination
    const totalPages = Math.ceil(totalItems / limit)
    const skip = (page - 1) * limit

    // Get users with pagination
    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      include: {
        Profile: {
          select: {
            fullName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform to admin user format
    const adminUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      fullName: user.Profile?.fullName || 'Unknown',
      avatar: user.Profile?.avatar || undefined,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      inActiveAt: user.inActiveAt?.toISOString(),
    }))

    return {
      users: adminUsers,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    }
  }

  async lockUnlockUser(userId: number, isActive: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Always update both isActive and inActiveAt to current time
    const updateData = {
      isActive,
      inActiveAt: new Date(), // Always set to current time
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    return { success: true, message: 'User locked/unlocked successfully' }
  }
}

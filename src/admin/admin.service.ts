import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common'
import { PrismaService } from '../configs/db/prisma.service'
import { EProviderTokens } from '@/utils/enums'
import type {
  TAdminUsersData,
  TGetAdminUsersParams,
  TLockUnlockUserParams,
  TDeleteUserParams,
} from './admin.type'

@Injectable()
export class AdminService {
  constructor(@Inject(EProviderTokens.PRISMA_CLIENT) private prismaService: PrismaService) {}

  async getUsers(params: TGetAdminUsersParams): Promise<TAdminUsersData> {
    const { page, limit, search, isLocked } = params

    // Build where clause for filtering
    const where: any = {}

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { Profile: { fullName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (isLocked && isLocked !== 'all') {
      where.isLocked = isLocked === 'locked'
    }

    // Count total items for pagination
    const totalItems = await this.prismaService.user.count({ where })

    // Calculate pagination
    const totalPages = Math.ceil(totalItems / limit)
    const skip = (page - 1) * limit

    // Get users with pagination
    const users = await this.prismaService.user.findMany({
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
    // const adminUsers = users.map(user => ({
    //   id: user.id,
    //   email: user.email,
    //   fullName: user.Profile?.fullName || 'Unknown',
    //   avatar: user.Profile?.avatar,
    //   isLocked: user.isLocked || false,
    //   createdAt: user.createdAt.toISOString(),
    //   lastActive: user.lastActive?.toISOString()
    // }))
    const adminUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      fullName: user.Profile?.fullName || 'Unknown',
      avatar: user.Profile?.avatar || undefined,
      isLocked: false,
      createdAt: user.createdAt.toISOString(),
      lastActive: user.createdAt.toISOString(),
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

  async lockUnlockUser(params: TLockUnlockUserParams): Promise<{ success: boolean }> {
    // const { userId, isLocked } = params

    // // Check if user exists
    // const user = await this.prismaService.user.findUnique({
    //   where: { id: userId }
    // })

    // if (!user) {
    //   throw new NotFoundException('User not found')
    // }

    // // Prevent locking admin account
    // if (user.email === 'admin@thunderchat.com' && isLocked) {
    //   throw new BadRequestException('Cannot lock admin account')
    // }

    // // Update user lock status
    // await this.prismaService.user.update({
    //   where: { id: userId },
    //   data: { false }
    // })

    return { success: true }
  }

  async deleteUser(params: TDeleteUserParams): Promise<{ success: boolean }> {
    // const { userId } = params

    // // Check if user exists
    // const user = await this.prismaService.user.findUnique({
    //   where: { id: userId }
    // })

    // if (!user) {
    //   throw new NotFoundException('User not found')
    // }

    // // Prevent deleting admin account
    // if (user.email === 'admin@thunderchat.com') {
    //   throw new BadRequestException('Cannot delete admin account')
    // }

    // // Delete user (cascade will handle related data)
    // await this.prismaService.user.delete({
    //   where: { id: userId }
    // })

    return { success: true }
  }
}

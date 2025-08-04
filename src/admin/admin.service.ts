import { Injectable, Inject } from '@nestjs/common'
import { PrismaService } from '@/configs/db/prisma.service'
import { UserService } from '@/user/user.service'
import { EProviderTokens, EAppRoles } from '@/utils/enums'
import { TAdminUsersData, TGetAdminUsersParams, TUpdateUserEmailResponse } from './admin.type'

@Injectable()
export class AdminService {
  constructor(
    @Inject(EProviderTokens.PRISMA_CLIENT)
    private prisma: PrismaService,
    private userService: UserService
  ) {}

  async getUsers(params: TGetAdminUsersParams): Promise<TAdminUsersData> {
    const { page, limit, search, status } = params

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
            birthday: true,
            about: true,
          },
        },
        ReportsAbout: {
          include: {
            Actions: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform to admin user format
    let adminUsers = users.map((user) => {
      // Get the latest violation action for this user
      const latestViolationAction = user.ReportsAbout.flatMap((report) => report.Actions).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]

      // Determine status based on latest violation action
      let status = 'NORMAL'
      if (latestViolationAction) {
        status = latestViolationAction.actionType
      }

      return {
        id: user.id,
        email: user.email,
        fullName: user.Profile?.fullName || 'Unknown',
        avatar: user.Profile?.avatar || undefined,
        birthday: user.Profile?.birthday?.toISOString() || null,
        about: user.Profile?.about || null,
        status,
        createdAt: user.createdAt.toISOString(),
      }
    })

    // Filter by status if specified
    if (status && status !== 'all') {
      adminUsers = adminUsers.filter((user) => user.status === status)
    }

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

  async updateUserEmail(userId: number, newEmail: string): Promise<TUpdateUserEmailResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return {
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      }
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: newEmail },
    })

    if (existingUser && existingUser.id !== userId) {
      return {
        success: false,
        message: 'Email already exists',
        error: 'EMAIL_ALREADY_EXISTS',
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { email: newEmail },
    })

    return { success: true, message: 'User email updated successfully' }
  }
}

import { Injectable, Inject } from '@nestjs/common'
import { PrismaService } from '@/configs/db/prisma.service'
import { UserService } from '@/user/user.service'
import { SocketService } from '@/gateway/socket/socket.service'
import { EProviderTokens, EAppRoles } from '@/utils/enums'
import {
  TAdminUsersData,
  TGetAdminUsersParams,
  TUpdateUserEmailResponse,
  TSystemOverviewData,
  TGetSystemOverviewParams,
  TUserMessageStats,
  TGetUserMessageStatsParams,
  TGetUserMessageStatsData,
} from './admin.type'

@Injectable()
export class AdminService {
  constructor(
    @Inject(EProviderTokens.PRISMA_CLIENT)
    private prisma: PrismaService,
    private userService: UserService,
    private socketService: SocketService
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

  async getSystemOverview(params: TGetSystemOverviewParams): Promise<TSystemOverviewData> {
    const { timeRange = 'month', startDate, endDate } = params

    // Calculate date range
    const now = new Date()
    let periodStart: Date
    let periodEnd: Date = now

    if (startDate && endDate) {
      periodStart = new Date(startDate)
      periodEnd = new Date(endDate)
    } else {
      switch (timeRange) {
        case 'day':
          periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'year':
          periodStart = new Date(now.getFullYear(), 0, 1)
          break
        default:
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      }
    }

    // Get total users
    const totalUsers = await this.prisma.user.count({
      where: { role: EAppRoles.USER },
    })

    // Get active users (currently connected users)
    const activeUsers = this.socketService.getConnectedClientsCount()
    this.socketService.printOutSession()

    console.log('activeUsers', activeUsers)

    // Get new users in this period
    const newUsersThisPeriod = await this.prisma.user.count({
      where: {
        role: EAppRoles.USER,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    })

    // Get total direct messages
    const totalDirectMessages = await this.prisma.directMessage.count()

    // Get total group messages
    const totalGroupMessages = await this.prisma.groupMessage.count()

    // Get total messages (sum of direct and group messages)
    const totalMessages = totalDirectMessages + totalGroupMessages

    // Get direct messages in this period
    const directMessagesThisPeriod = await this.prisma.directMessage.count({
      where: {
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    })

    // Get group messages in this period
    const groupMessagesThisPeriod = await this.prisma.groupMessage.count({
      where: {
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    })

    // Total messages in this period
    const messagesThisPeriod = directMessagesThisPeriod + groupMessagesThisPeriod

    // Get active group chats (all group chats)
    const activeGroupChats = await this.prisma.groupChat.count()

    // Get new group chats in this period
    const groupChatsThisPeriod = await this.prisma.groupChat.count({
      where: {
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    })

    // Get violation reports statistics
    const totalViolationReports = await this.prisma.violationReport.count()

    const resolvedViolationReports = await this.prisma.violationReport.count({
      where: {
        reportStatus: 'RESOLVED',
      },
    })

    const pendingViolationReports = await this.prisma.violationReport.count({
      where: {
        reportStatus: 'PENDING',
      },
    })

    // Generate chart data for the specified time range
    const chartData = await this.generateChartData(periodStart, periodEnd)

    // Determine the actual period based on provided parameters
    let actualPeriod: 'day' | 'week' | 'month' | 'year' | 'custom' = timeRange
    if (startDate && endDate) {
      actualPeriod = 'custom'
    }

    return {
      activeUsers,
      totalMessages,
      totalDirectMessages,
      totalGroupMessages,
      activeGroupChats,
      totalUsers,
      newUsersThisPeriod,
      messagesThisPeriod,
      groupChatsThisPeriod,
      totalViolationReports,
      resolvedViolationReports,
      pendingViolationReports,
      timeRange: {
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString(),
        period: actualPeriod,
      },
      charts: chartData,
    }
  }

  async getUserMessageStats(params: TGetUserMessageStatsParams): Promise<TGetUserMessageStatsData> {
    const { page, limit, search, sortBy = 'totalMessageCount', sortOrder = 'desc' } = params

    // Build where clause for filtering users
    const where: any = {
      role: EAppRoles.USER, // Only get users with role USER
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { Profile: { fullName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Count total users for pagination
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
        DirectMessages: {
          select: {
            id: true,
            createdAt: true,
          },
        },
        GroupMessages: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform to user message stats format
    const userStats = await Promise.all(
      users.map(async (user) => {
        // Count direct messages
        const directMessageCount = await this.prisma.directMessage.count({
          where: { authorId: user.id },
        })

        // Count group messages
        const groupMessageCount = await this.prisma.groupMessage.count({
          where: { authorId: user.id },
        })

        // Get last message time
        const lastDirectMessage = await this.prisma.directMessage.findFirst({
          where: { authorId: user.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        })

        const lastGroupMessage = await this.prisma.groupMessage.findFirst({
          where: { authorId: user.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        })

        let lastMessageAt: string | undefined
        if (lastDirectMessage && lastGroupMessage) {
          lastMessageAt = new Date(
            Math.max(lastDirectMessage.createdAt.getTime(), lastGroupMessage.createdAt.getTime())
          ).toISOString()
        } else if (lastDirectMessage) {
          lastMessageAt = lastDirectMessage.createdAt.toISOString()
        } else if (lastGroupMessage) {
          lastMessageAt = lastGroupMessage.createdAt.toISOString()
        }

        return {
          userId: user.id,
          email: user.email,
          fullName: user.Profile?.fullName || 'Unknown',
          avatar: user.Profile?.avatar || undefined,
          directMessageCount,
          groupMessageCount,
          totalMessageCount: directMessageCount + groupMessageCount,
          lastMessageAt,
        }
      })
    )

    // Sort the results
    userStats.sort((a, b) => {
      let aValue: number | string
      let bValue: number | string

      switch (sortBy) {
        case 'directMessageCount':
          aValue = a.directMessageCount
          bValue = b.directMessageCount
          break
        case 'groupMessageCount':
          aValue = a.groupMessageCount
          bValue = b.groupMessageCount
          break
        case 'totalMessageCount':
          aValue = a.totalMessageCount
          bValue = b.totalMessageCount
          break
        case 'lastMessageAt':
          aValue = a.lastMessageAt || ''
          bValue = b.lastMessageAt || ''
          break
        default:
          aValue = a.totalMessageCount
          bValue = b.totalMessageCount
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return {
      users: userStats,
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

  private async generateChartData(startDate: Date, endDate: Date) {
    // Ensure endDate is set to end of day for accurate counting
    const adjustedEndDate = new Date(endDate)
    adjustedEndDate.setHours(23, 59, 59, 999)

    const days = Math.ceil(
      (adjustedEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    const userGrowth: Array<{ date: string; count: number }> = []
    const messageActivity: Array<{ date: string; count: number }> = []
    const groupChatActivity: Array<{ date: string; count: number }> = []

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const nextDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
      const dateStr = currentDate.toISOString().split('T')[0]

      // Count new users for this day within the specified time range
      const newUsers = await this.prisma.user.count({
        where: {
          role: EAppRoles.USER,
          createdAt: {
            gte: currentDate,
            lt: nextDate,
          },
        },
      })

      // Count messages for this day within the specified time range
      const directMessages = await this.prisma.directMessage.count({
        where: {
          createdAt: {
            gte: currentDate,
            lt: nextDate,
          },
        },
      })

      const groupMessages = await this.prisma.groupMessage.count({
        where: {
          createdAt: {
            gte: currentDate,
            lt: nextDate,
          },
        },
      })

      const messages = directMessages + groupMessages

      // Count new group chats for this day within the specified time range
      const newGroupChats = await this.prisma.groupChat.count({
        where: {
          createdAt: {
            gte: currentDate,
            lt: nextDate,
          },
        },
      })

      userGrowth.push({ date: dateStr, count: newUsers })
      messageActivity.push({ date: dateStr, count: messages })
      groupChatActivity.push({ date: dateStr, count: newGroupChats })
    }

    return {
      userGrowth,
      messageActivity,
      groupChatActivity,
    }
  }
}

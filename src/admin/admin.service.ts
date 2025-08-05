import { Injectable, Inject } from '@nestjs/common'
import { PrismaService } from '@/configs/db/prisma.service'
import { UserService } from '@/user/user.service'
import { EProviderTokens, EAppRoles } from '@/utils/enums'
import {
  TAdminUsersData,
  TGetAdminUsersParams,
  TUpdateUserEmailResponse,
  TViolationReportsData,
  TGetViolationReportsParams,
  TViolationReportDetail,
  TUpdateViolationReportStatusResponse,
  TBanUserResponse,
  TViolationReport,
  TGetUserReportHistoryParams,
  TUserReportHistoryData,
} from './admin.type'

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

  // Violation Reports Methods
  async getViolationReports(params: TGetViolationReportsParams): Promise<TViolationReportsData> {
    const { page, limit, search, status, category, startDate, endDate, sortBy, sortOrder } = params

    // Build where clause for filtering
    const where: any = {}

    // Search filter
    if (search) {
      where.OR = [
        {
          ReporterUser: {
            Profile: {
              fullName: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          ReporterUser: {
            email: { contains: search, mode: 'insensitive' },
          },
        },
        {
          ReportedUser: {
            Profile: {
              fullName: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          ReportedUser: {
            email: { contains: search, mode: 'insensitive' },
          },
        },
        {
          reasonText: { contains: search, mode: 'insensitive' },
        },
      ]
    }

    // Status filter
    if (status && status !== 'ALL') {
      where.reportStatus = status
    }

    // Category filter
    if (category && category !== 'ALL') {
      where.reportCategory = category
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    // Count total items for pagination
    const totalItems = await this.prisma.violationReport.count({ where })

    // Calculate pagination
    const totalPages = Math.ceil(totalItems / limit)
    const skip = (page - 1) * limit

    // Get violation reports with pagination
    const reports = await this.prisma.violationReport.findMany({
      where,
      skip,
      take: limit,
      include: {
        ReporterUser: {
          include: {
            Profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
        ReportedUser: {
          include: {
            Profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
        ReportImages: {
          select: {
            id: true,
            imageUrl: true,
          },
        },
        ReportedMessages: {
          select: {
            id: true,
            messageId: true,
            messageType: true,
            messageContent: true,
          },
        },
      },
      orderBy: { [sortBy as string]: sortOrder },
    })

    // Transform to admin format
    const violationReports = reports.map((report) => ({
      id: report.id,
      reporterId: report.reporterUserId,
      reporterName: report.ReporterUser.Profile?.fullName || 'Unknown',
      reporterEmail: report.ReporterUser.email,
      reportedUserId: report.reportedUserId,
      reportedUserName: report.ReportedUser.Profile?.fullName || 'Unknown',
      reportedUserEmail: report.ReportedUser.email,
      reportCategory: report.reportCategory,
      reasonText: report.reasonText,
      status: report.reportStatus,
      evidenceCount: {
        images: report.ReportImages.length,
        messages: report.ReportedMessages.length,
      },
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.createdAt.toISOString(), // Using createdAt as updatedAt since there's no updatedAt field
    })) as TViolationReport[]

    // Get statistics
    const statistics = await this.getViolationReportsStatistics()

    return {
      reports: violationReports,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      statistics,
    }
  }

  async getViolationReportDetail(reportId: number): Promise<TViolationReportDetail | null> {
    const report = await this.prisma.violationReport.findUnique({
      where: { id: reportId },
      include: {
        ReporterUser: {
          include: {
            Profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
        ReportedUser: {
          include: {
            Profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
        ReportImages: {
          select: {
            id: true,
            imageUrl: true,
          },
        },
        ReportedMessages: {
          select: {
            id: true,
            messageId: true,
            messageType: true,
            messageContent: true,
          },
        },
      },
    })

    if (!report) {
      return null
    }

    return {
      id: report.id,
      reporterId: report.reporterUserId,
      reporterName: report.ReporterUser.Profile?.fullName || 'Unknown',
      reporterEmail: report.ReporterUser.email,
      reportedUserId: report.reportedUserId,
      reportedUserName: report.ReportedUser.Profile?.fullName || 'Unknown',
      reportedUserEmail: report.ReportedUser.email,
      reportCategory: report.reportCategory,
      reasonText: report.reasonText,
      status: report.reportStatus,
      evidenceCount: {
        images: report.ReportImages.length,
        messages: report.ReportedMessages.length,
      },
      reportImages: report.ReportImages.map((image) => ({
        id: image.id,
        imageUrl: image.imageUrl,
        createdAt: report.createdAt.toISOString(), // Using report createdAt since ReportImage doesn't have createdAt
      })),
      reportedMessages: report.ReportedMessages.map((message) => ({
        id: message.id,
        messageId: message.messageId,
        messageType: message.messageType,
        messageContent: message.messageContent,
        createdAt: report.createdAt.toISOString(), // Using report createdAt since ReportedMessage doesn't have createdAt in schema
      })),
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.createdAt.toISOString(), // Using createdAt as updatedAt since there's no updatedAt field
    }
  }

  async updateViolationReportStatus(
    reportId: number,
    status: string
  ): Promise<TUpdateViolationReportStatusResponse> {
    const report = await this.prisma.violationReport.findUnique({
      where: { id: reportId },
    })

    if (!report) {
      return {
        success: false,
        message: 'Violation report not found',
        error: 'REPORT_NOT_FOUND',
      }
    }

    // Check if report is already processed
    if (report.reportStatus !== 'PENDING') {
      return {
        success: false,
        message: `Cannot update status. Report is already ${report.reportStatus.toLowerCase()}`,
        error: 'REPORT_ALREADY_PROCESSED',
      }
    }

    await this.prisma.violationReport.update({
      where: { id: reportId },
      data: {
        reportStatus: status as any, // Type assertion for enum
      },
    })

    return {
      success: true,
      message: `Violation report status updated to ${status}`,
    }
  }

  async banReportedUser(
    reportId: number,
    banType: string,
    reason: string,
    banDuration?: number
  ): Promise<TBanUserResponse> {
    const report = await this.prisma.violationReport.findUnique({
      where: { id: reportId },
      include: {
        ReportedUser: true,
      },
    })

    if (!report) {
      return {
        success: false,
        message: 'Violation report not found',
        error: 'REPORT_NOT_FOUND',
      }
    }

    const reportedUser = report.ReportedUser
    if (!reportedUser) {
      return {
        success: false,
        message: 'Reported user not found',
        error: 'USER_NOT_FOUND',
      }
    }

    // Check if report is already processed
    if (report.reportStatus !== 'PENDING') {
      return {
        success: false,
        message: `Cannot perform action. Report is already ${report.reportStatus.toLowerCase()}`,
        error: 'REPORT_ALREADY_PROCESSED',
      }
    }

    // Create violation action
    const actionData: any = {
      reportId: reportId,
      actionType: banType,
      actionReason: reason,
      // Note: adminId field doesn't exist in schema, would need to be added
    }

    if (banType === 'TEMPORARY_BAN' && banDuration) {
      actionData.bannedUntil = new Date(Date.now() + banDuration * 24 * 60 * 60 * 1000)
    }
    // For WARNING, no ban duration is set

    await this.prisma.violationAction.create({
      data: actionData,
    })

    // Update report status
    await this.prisma.violationReport.update({
      where: { id: reportId },
      data: {
        reportStatus: 'RESOLVED',
      },
    })

    const actionMessage =
      banType === 'WARNING'
        ? 'Warning issued successfully'
        : `User banned successfully with ${banType}`

    return {
      success: true,
      message: actionMessage,
    }
  }

  async getUserReportHistory(params: TGetUserReportHistoryParams): Promise<{
    success: boolean
    data?: TUserReportHistoryData
    message?: string
    error?: string
  }> {
    try {
      const { userId, type, page = 1, limit = 10 } = params
      const skip = (page - 1) * limit

      let reports: any[] = []
      let total = 0

      if (type === 'reported') {
        // Get reports MADE BY this user (user is reporter)
        const result = await this.prisma.violationReport.findMany({
          where: {
            reporterUserId: userId,
          },
          include: {
            ReportedUser: {
              include: {
                Profile: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        })

        total = await this.prisma.violationReport.count({
          where: {
            reporterUserId: userId,
          },
        })

        reports = result.map((report) => ({
          id: report.id,
          reportCategory: report.reportCategory,
          status: report.reportStatus,
          createdAt: report.createdAt.toISOString(),
          reasonText: report.reasonText,
          reportedUserName: report.ReportedUser.Profile?.fullName || report.ReportedUser.email,
          reportedUserEmail: report.ReportedUser.email,
        }))
      } else {
        // Get reports ABOUT this user (user is reported)
        const result = await this.prisma.violationReport.findMany({
          where: {
            reportedUserId: userId,
          },
          include: {
            ReporterUser: {
              include: {
                Profile: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        })

        total = await this.prisma.violationReport.count({
          where: {
            reportedUserId: userId,
          },
        })

        reports = result.map((report) => ({
          id: report.id,
          reportCategory: report.reportCategory,
          status: report.reportStatus,
          createdAt: report.createdAt.toISOString(),
          reasonText: report.reasonText,
          reporterName: report.ReporterUser.Profile?.fullName || report.ReporterUser.email,
          reporterEmail: report.ReporterUser.email,
        }))
      }

      const totalPages = Math.ceil(total / limit)

      return {
        success: true,
        data: {
          reports,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        },
      }
    } catch (error) {
      console.error('Error fetching user report history:', error)
      return {
        success: false,
        message: 'Failed to fetch user report history',
        error: 'FETCH_ERROR',
      }
    }
  }

  private async getViolationReportsStatistics() {
    const [total, pending, resolved, dismissed] = await Promise.all([
      this.prisma.violationReport.count(),
      this.prisma.violationReport.count({ where: { reportStatus: 'PENDING' } }),
      this.prisma.violationReport.count({ where: { reportStatus: 'RESOLVED' } }),
      this.prisma.violationReport.count({ where: { reportStatus: 'DISMISSED' } }),
    ])

    return {
      total,
      pending,
      resolved,
      dismissed,
    }
  }

  /**
   * Helper method to check if a violation report can be processed
   * @param reportId - The ID of the violation report
   * @returns Object with canProcess boolean and current status
   */
  async checkReportProcessability(reportId: number): Promise<{
    canProcess: boolean
    currentStatus: string | null
    message: string
  }> {
    const report = await this.prisma.violationReport.findUnique({
      where: { id: reportId },
      select: { reportStatus: true },
    })

    if (!report) {
      return {
        canProcess: false,
        currentStatus: null,
        message: 'Violation report not found',
      }
    }

    if (report.reportStatus !== 'PENDING') {
      return {
        canProcess: false,
        currentStatus: report.reportStatus,
        message: `Report is already ${report.reportStatus.toLowerCase()}`,
      }
    }

    return {
      canProcess: true,
      currentStatus: report.reportStatus,
      message: 'Report can be processed',
    }
  }
}

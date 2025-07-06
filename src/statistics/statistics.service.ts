import { Injectable } from '@nestjs/common'
import { PrismaService } from '../configs/db/prisma.service'
import { EProviderTokens } from '@/utils/enums'
import { Inject } from '@nestjs/common'
import type { TMonthlyStats, TOverallStats, TUserStats } from './statistics.type'
import type { GetMonthlyStatsDTO, GetUserStatsDTO, GetOverallStatsDTO } from './statistics.dto'
import type { IStatisticsService } from './statistics.interface'
import dayjs from 'dayjs'

@Injectable()
export class StatisticsService implements IStatisticsService {
   constructor(
      @Inject(EProviderTokens.PRISMA_CLIENT) private PrismaService: PrismaService
   ) { }

   async getMonthlyStats(params: GetMonthlyStatsDTO): Promise<TMonthlyStats[]> {
      const { startDate, endDate, year, month } = params

      // Xây dựng điều kiện WHERE
      const whereCondition: any = {}

      if (startDate && endDate) {
         whereCondition.createdAt = {
            gte: new Date(startDate),
            lte: new Date(endDate)
         }
      } else if (year) {
         const startOfYear = new Date(year, 0, 1)
         const endOfYear = new Date(year, 11, 31, 23, 59, 59)
         whereCondition.createdAt = {
            gte: startOfYear,
            lte: endOfYear
         }
      }

      // Thống kê theo tháng
      const monthlyStats = await this.PrismaService.$queryRaw<any[]>`
         SELECT 
            DATE_TRUNC('month', dc."created_at") as month,
            EXTRACT(YEAR FROM dc."created_at") as year,
            EXTRACT(MONTH FROM dc."created_at") as month_number,
            COUNT(DISTINCT dc.id) as total_chats,
            COUNT(DISTINCT dm.id) as total_messages,
            COUNT(DISTINCT CASE WHEN dm."media_url" IS NOT NULL THEN dm.id END) as total_files
         FROM "direct_chats" dc
         LEFT JOIN "direct_messages" dm ON dc.id = dm."direct_chat_id"
         WHERE dc."created_at" >= ${startDate ? new Date(startDate) : new Date('2020-01-01')}
         AND dc."created_at" <= ${endDate ? new Date(endDate) : new Date()}
         GROUP BY DATE_TRUNC('month', dc."created_at"), EXTRACT(YEAR FROM dc."created_at"), EXTRACT(MONTH FROM dc."created_at")
         ORDER BY month DESC
      `

      return monthlyStats.map((stat: any) => ({
         month: dayjs(stat.month).format('YYYY-MM'),
         year: parseInt(stat.year),
         monthNumber: parseInt(stat.month_number),
         totalChats: parseInt(stat.total_chats),
         totalMessages: parseInt(stat.total_messages),
         totalFiles: parseInt(stat.total_files)
      }))
   }

   async getOverallStats(params: GetOverallStatsDTO): Promise<TOverallStats> {
      const { startDate, endDate } = params

      const whereCondition: any = {}
      if (startDate && endDate) {
         whereCondition.createdAt = {
            gte: new Date(startDate),
            lte: new Date(endDate)
         }
      }

      // Thống kê tổng quan
      const [chatCount, messageCount, fileCount, userCount] = await Promise.all([
         this.PrismaService.directChat.count({ where: whereCondition }),
         this.PrismaService.directMessage.count({ where: whereCondition }),
         this.PrismaService.directMessage.count({
            where: {
               ...whereCondition,
               mediaUrl: { not: null }
            }
         }),
         this.PrismaService.user.count()
      ])

      return {
         totalChats: chatCount,
         totalMessages: messageCount,
         totalFiles: fileCount,
         totalUsers: userCount,
         averageMessagesPerChat: chatCount > 0 ? Math.round(messageCount / chatCount * 100) / 100 : 0,
         averageFilesPerChat: chatCount > 0 ? Math.round(fileCount / chatCount * 100) / 100 : 0
      }
   }

   async getUserStats(params: GetUserStatsDTO): Promise<TUserStats[]> {
      const { userId, startDate, endDate } = params

      // Build WHERE conditions
      let whereConditions: string[] = []
      let queryParams: any[] = []
      let paramIndex = 1

      if (userId) {
         whereConditions.push(`u.id = $${paramIndex}`)
         queryParams.push(userId)
         paramIndex++
      }

      if (startDate && endDate) {
         whereConditions.push(`dm."created_at" >= $${paramIndex} AND dm."created_at" <= $${paramIndex + 1}`)
         queryParams.push(new Date(startDate), new Date(endDate))
         paramIndex += 2
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

      const userStats = await this.PrismaService.$queryRawUnsafe<any[]>(`
         SELECT 
            u.id as user_id,
            u.email as username,
            COUNT(DISTINCT dc.id) as total_chats,
            COUNT(DISTINCT dm.id) as total_messages,
            COUNT(DISTINCT CASE WHEN dm."media_url" IS NOT NULL THEN dm.id END) as total_files,
            MAX(dm."created_at") as last_active
         FROM "users" u
         LEFT JOIN "direct_chats" dc ON (u.id = dc."creator_id" OR u.id = dc."recipient_id")
         LEFT JOIN "direct_messages" dm ON u.id = dm."author_id"
         ${whereClause}
         GROUP BY u.id, u.email
         ORDER BY total_messages DESC
      `, ...queryParams)

      return userStats.map((stat: any) => ({
         userId: parseInt(stat.user_id),
         username: stat.username,
         totalChats: parseInt(stat.total_chats),
         totalMessages: parseInt(stat.total_messages),
         totalFiles: parseInt(stat.total_files),
         lastActive: stat.last_active ? new Date(stat.last_active) : new Date()
      }))
   }

   async getTopActiveUsers(limit: number = 10): Promise<TUserStats[]> {
      const topUsers = await this.PrismaService.$queryRaw<any[]>`
         SELECT 
            u.id as user_id,
            u.email as username,
            COUNT(DISTINCT dc.id) as total_chats,
            COUNT(DISTINCT dm.id) as total_messages,
            COUNT(DISTINCT CASE WHEN dm."media_url" IS NOT NULL THEN dm.id END) as total_files,
            MAX(dm."created_at") as last_active
         FROM "users" u
         LEFT JOIN "direct_chats" dc ON (u.id = dc."creator_id" OR u.id = dc."recipient_id")
         LEFT JOIN "direct_messages" dm ON u.id = dm."author_id"
         GROUP BY u.id, u.email
         ORDER BY total_messages DESC
         LIMIT ${limit}
      `

      return topUsers.map((stat: any) => ({
         userId: parseInt(stat.user_id),
         username: stat.username,
         totalChats: parseInt(stat.total_chats),
         totalMessages: parseInt(stat.total_messages),
         totalFiles: parseInt(stat.total_files),
         lastActive: stat.last_active ? new Date(stat.last_active) : new Date()
      }))
   }
} 
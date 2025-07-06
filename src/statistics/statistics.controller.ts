import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { StatisticsService } from './statistics.service'
import { GetMonthlyStatsDTO, GetUserStatsDTO, GetOverallStatsDTO } from './statistics.dto'
import type { TMonthlyStats, TOverallStats, TUserStats } from './statistics.type'
// import { AuthGuard } from '../auth/auth.guard' // Uncomment khi có auth

@Controller('statistics')
export class StatisticsController {
   constructor(private readonly statisticsService: StatisticsService) { }

   @Get('monthly')
   // @UseGuards(AuthGuard) // Uncomment khi có auth
   async getMonthlyStats(@Query() query: GetMonthlyStatsDTO): Promise<TMonthlyStats[]> {
      return await this.statisticsService.getMonthlyStats(query)
   }

   @Get('overall')
   // @UseGuards(AuthGuard) // Uncomment khi có auth
   async getOverallStats(@Query() query: GetOverallStatsDTO): Promise<TOverallStats> {
      return await this.statisticsService.getOverallStats(query)
   }

   @Get('users')
   // @UseGuards(AuthGuard) // Uncomment khi có auth
   async getUserStats(@Query() query: GetUserStatsDTO): Promise<TUserStats[]> {
      return await this.statisticsService.getUserStats(query)
   }

   @Get('top-users')
   // @UseGuards(AuthGuard) // Uncomment khi có auth
   async getTopActiveUsers(@Query('limit') limit?: string): Promise<TUserStats[]> {
      const limitNumber = limit ? parseInt(limit) : 10
      return await this.statisticsService.getTopActiveUsers(limitNumber)
   }

   @Get('dashboard')
   // @UseGuards(AuthGuard) // Uncomment khi có auth
   async getDashboardStats() {
      const [overallStats, monthlyStats, topUsers] = await Promise.all([
         this.statisticsService.getOverallStats({}),
         this.statisticsService.getMonthlyStats({}),
         this.statisticsService.getTopActiveUsers(5)
      ])

      return {
         overall: overallStats,
         monthly: monthlyStats.slice(0, 6), // 6 tháng gần nhất
         topUsers
      }
   }
} 
import type { TMonthlyStats, TOverallStats, TUserStats } from './statistics.type'
import type { GetMonthlyStatsDTO, GetUserStatsDTO, GetOverallStatsDTO } from './statistics.dto'

export interface IStatisticsService {
  getMonthlyStats(params: GetMonthlyStatsDTO): Promise<TMonthlyStats[]>
  getOverallStats(params: GetOverallStatsDTO): Promise<TOverallStats>
  getUserStats(params: GetUserStatsDTO): Promise<TUserStats[]>
  getTopActiveUsers(limit?: number): Promise<TUserStats[]>
}

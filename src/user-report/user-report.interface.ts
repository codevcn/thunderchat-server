import { CreateViolationReportDTO } from './user-report.dto'

export interface IUserReportService {
  createViolationReport(
    reporterUserId: number,
    createViolationReportData: CreateViolationReportDTO,
    reportImages?: Express.Multer.File[]
  ): Promise<{
    success: boolean
    reportId?: number
    message?: string
    error?: string
    code?: string
    details?: any
  }>
}

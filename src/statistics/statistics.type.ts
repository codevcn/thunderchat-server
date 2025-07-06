export type TMonthlyStats = {
   month: string // Format: "YYYY-MM"
   year: number
   monthNumber: number
   totalChats: number
   totalMessages: number
   totalFiles: number
}

export type TOverallStats = {
   totalChats: number
   totalMessages: number
   totalFiles: number
   totalUsers: number
   averageMessagesPerChat: number
   averageFilesPerChat: number
}

export type TUserStats = {
   userId: number
   username: string
   totalChats: number
   totalMessages: number
   totalFiles: number
   lastActive: Date
}

export type TDateRange = {
   startDate: Date
   endDate: Date
} 
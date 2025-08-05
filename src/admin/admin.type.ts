export type TAdminUser = {
  id: number
  email: string
  fullName: string
  avatar?: string
  birthday?: string | null
  about?: string | null
  status: string
  createdAt: string
}

export type TAdminUsersData = {
  users: TAdminUser[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export type TGetAdminUsersParams = {
  page: number
  limit: number
  search?: string
  status?: 'all' | 'NORMAL' | 'WARNING' | 'TEMPORARY_BAN' | 'PERMANENT_BAN'
}

export type TLockUnlockUserParams = {
  userId: number
  isLocked: boolean
}

export type TDeleteUserParams = {
  userId: number
}

export type TUpdateUserEmailResponse = {
  success: boolean
  message: string
  error?: string
}

export type TSystemOverviewData = {
  activeUsers: number
  totalMessages: number
  totalDirectMessages: number
  totalGroupMessages: number
  activeGroupChats: number
  totalUsers: number
  newUsersThisPeriod: number
  messagesThisPeriod: number
  groupChatsThisPeriod: number
  totalViolationReports: number
  resolvedViolationReports: number
  pendingViolationReports: number
  timeRange: {
    startDate: string
    endDate: string
    period: 'day' | 'week' | 'month' | 'year' | 'custom'
  }
  charts?: {
    userGrowth?: Array<{ date: string; count: number }>
    messageActivity?: Array<{ date: string; count: number }>
    groupChatActivity?: Array<{ date: string; count: number }>
  }
}

export type TGetSystemOverviewParams = {
  timeRange?: 'day' | 'week' | 'month' | 'year'
  startDate?: string
  endDate?: string
}

export type TUserMessageStats = {
  userId: number
  email: string
  fullName: string
  avatar?: string
  directMessageCount: number
  groupMessageCount: number
  totalMessageCount: number
  lastMessageAt?: string
}

export type TGetUserMessageStatsParams = {
  page: number
  limit: number
  search?: string
  sortBy?: 'directMessageCount' | 'groupMessageCount' | 'totalMessageCount' | 'lastMessageAt'
  sortOrder?: 'asc' | 'desc'
}

export type TGetUserMessageStatsData = {
  users: TUserMessageStats[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

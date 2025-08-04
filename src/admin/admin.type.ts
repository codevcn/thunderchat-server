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

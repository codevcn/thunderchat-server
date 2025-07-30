export type TAdminUser = {
  id: number
  email: string
  fullName: string
  avatar?: string
  isLocked: boolean
  createdAt: string
  lastActive?: string
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
  isLocked?: 'all' | 'locked' | 'active'
}

export type TLockUnlockUserParams = {
  userId: number
  isLocked: boolean
}

export type TDeleteUserParams = {
  userId: number
}

export type TAdminUser = {
  id: number
  email: string
  fullName: string
  avatar?: string
  isActive: boolean
  createdAt: string
  inActiveAt?: string
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
  isActive?: 'all' | 'active' | 'inactive'
}

export type TLockUnlockUserParams = {
  userId: number
  isLocked: boolean
}

export type TDeleteUserParams = {
  userId: number
}

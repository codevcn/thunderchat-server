import type { TAdminUsersData } from './admin.type'

export interface IAdminController {
  getUsers(params: any): Promise<TAdminUsersData>
  lockUnlockUser(params: any): Promise<{ success: boolean }>
  deleteUser(params: any): Promise<{ success: boolean }>
}

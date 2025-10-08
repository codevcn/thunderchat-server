import { TUserWithProfile } from '@/utils/entities/user.entity'
import { TCastedFieldObject } from '@/utils/types'
import { AuthService as AuthServiceType, VerifyTokenResponse } from 'protos/generated/auth'

export class AuthService {
  constructor(private instance: AuthServiceType) {}

  async verifyToken(token: string) {
    return (
      (await this.instance.VerifyToken({ token })) as TCastedFieldObject<
        VerifyTokenResponse,
        'user',
        TUserWithProfile
      >
    ).user
  }
}

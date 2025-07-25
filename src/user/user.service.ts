import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
  BadRequestException,
} from '@nestjs/common'
import type { TCreateUserParams, TSearchUsersData, TSearchProfilesData } from './user.type'
import { PrismaService } from '../configs/db/prisma.service'
import { EProviderTokens, ESyncDataToESWorkerType } from '@/utils/enums'
import { JWTService } from '@/auth/jwt/jwt.service'
import { CredentialService } from '@/auth/credentials/credentials.service'
import { EAuthMessages } from '@/auth/auth.message'
import { TUser, TUserWithProfile } from '@/utils/entities/user.entity'
import { TJWTToken, TSignatureObject } from '@/utils/types'
import { SearchUsersDTO } from './user.dto'
import { EUserMessages } from '@/user/user.message'
import { SyncDataToESService } from '@/configs/elasticsearch/sync-data-to-ES/sync-data-to-ES.service'
import { checkIsEmail } from '@/utils/helpers'

@Injectable()
export class UserService {
  constructor(
    @Inject(EProviderTokens.PRISMA_CLIENT) private PrismaService: PrismaService,
    private jwtService: JWTService,
    private credentialService: CredentialService,
    private syncDataToESService: SyncDataToESService
  ) {}

  async findById(id: number): Promise<TUser | null> {
    return await this.PrismaService.user.findUnique({
      where: { id },
    })
  }

  async findUserWithProfileById(userId: number): Promise<TUserWithProfile | null> {
    return await this.PrismaService.user.findUnique({
      where: { id: userId },
      include: {
        Profile: true,
      },
    })
  }

  async createUser({ email, password }: TCreateUserParams): Promise<TUser> {
    const hashedPassword = await this.credentialService.getHashedPassword(password)
    const existUser = await this.PrismaService.user.findUnique({
      where: { email },
    })
    if (existUser) {
      throw new ConflictException(EAuthMessages.USER_EXISTED)
    }
    const user = await this.PrismaService.user.create({
      data: {
        email: email,
        password: hashedPassword,
      },
    })
    // this.syncDataToESService.syncDataToES(user.id, {
    //    type: ESyncDataToESWorkerType.CREATE_USER,
    //    data: user,
    // })
    return user
  }

  async registerUser(createUserData: TCreateUserParams): Promise<TJWTToken> {
    const { fullName, birthday } = createUserData
    const user = await this.createUser(createUserData)
    await this.PrismaService.profile.create({
      data: {
        userId: user.id,
        fullName: fullName,
        birthday: birthday,
      },
    })
    return this.jwtService.createJWT({ email: user.email, user_id: user.id })
  }

  async getUserByEmail(email: string): Promise<TUserWithProfile> {
    const user = await this.PrismaService.user.findUnique({
      where: {
        email: email,
      },
      include: {
        Profile: true,
      },
    })
    if (!user) {
      throw new NotFoundException(EUserMessages.USER_NOT_FOUND)
    }

    return user
  }

  mergeSimilarUsers(profles: TSearchProfilesData[]): TSearchUsersData[] {
    const users: TSearchUsersData[] = []
    for (const profile of profles) {
      const { User, ...profileInfo } = profile
      const user = { ...User, Profile: profileInfo }
      users.push(user)
    }
    return users
  }

  async searchUsers(searchUsersPayload: SearchUsersDTO): Promise<TSearchUsersData[]> {
    // Tìm kiếm các user dựa trên keyword
    const { keyword, lastUserId, limit } = searchUsersPayload
    if (checkIsEmail(keyword)) {
      const user = await this.PrismaService.user.findUnique({
        where: { email: keyword },
        include: {
          Profile: true,
        },
      })
      if (user) {
        return [user]
      }
    }
    let cursor: TSignatureObject = {}
    if (lastUserId) {
      cursor = {
        skip: 1,
        cursor: {
          id: lastUserId,
        },
      }
    }
    const profiles = await this.PrismaService.profile.findMany({
      take: limit,
      ...cursor,
      where: {
        OR: [{ fullName: { contains: keyword, mode: 'insensitive' } }],
      },
      select: {
        id: true,
        fullName: true,
        avatar: true,
        User: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })
    const userFilter: number[] =
      profiles && profiles.length > 0 ? profiles.map((profile) => profile.User.id) : []
    const users = await this.PrismaService.user.findMany({
      take: limit,
      ...cursor,
      where: {
        id: { notIn: userFilter },
        email: { contains: keyword, mode: 'insensitive' },
      },
      select: {
        id: true,
        email: true,
        Profile: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    })
    const searchResult = [...users, ...this.mergeSimilarUsers(profiles)]
    return searchResult
  }

  async findUsersByIdsNotSelfUser(
    ids: number[],
    selfUserId: number,
    limit: number
  ): Promise<TUserWithProfile[]> {
    return await this.PrismaService.user.findMany({
      where: { id: { in: ids, not: selfUserId } },
      include: {
        Profile: true,
      },
      take: limit,
    })
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.findUserWithProfileById(userId)
    if (!user) throw new BadRequestException('User not found')

    // Kiểm tra mật khẩu cũ
    const isMatch = await this.credentialService.compareHashedPassword(oldPassword, user.password)
    if (!isMatch) throw new BadRequestException('Mật khẩu cũ không đúng')

    // Hash mật khẩu mới
    const hashed = await this.credentialService.getHashedPassword(newPassword)
    await this.PrismaService.user.update({
      where: { id: userId },
      data: { password: hashed },
    })
  }
}

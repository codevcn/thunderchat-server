import { BadRequestException, Injectable } from '@nestjs/common'

import { EProviderTokens } from '@/utils/enums'
import { PrismaService } from '@/configs/db/prisma.service'
import { Inject } from '@nestjs/common'
import type { TBlockedUserFullInfo } from '@/utils/entities/user.entity'
import { EBlockType } from '@/user/block-user.enum'
import { EUserMessages } from './user.message'

@Injectable()
export class BlockUserService {
  constructor(@Inject(EProviderTokens.PRISMA_CLIENT) private prismaService: PrismaService) {}

  async createBlockedUser(
    blockerUserId: number,
    blockedUserId: number,
    blockType: EBlockType
  ): Promise<TBlockedUserFullInfo> {
    return await this.prismaService.blockedUser.create({
      data: {
        blockerUserId: blockerUserId,
        blockedUserId: blockedUserId,
        blockType: blockType,
      },
      include: {
        UserBlocker: {
          include: {
            Profile: true,
          },
        },
        UserBlocked: {
          include: {
            Profile: true,
          },
        },
      },
    })
  }

  async findBlockedUser(userId: number, otherUserId: number): Promise<TBlockedUserFullInfo | null> {
    return await this.prismaService.blockedUser.findFirst({
      where: {
        OR: [
          { blockerUserId: userId, blockedUserId: otherUserId },
          { blockerUserId: otherUserId, blockedUserId: userId },
        ],
      },
      include: {
        UserBlocker: {
          include: {
            Profile: true,
          },
        },
        UserBlocked: {
          include: {
            Profile: true,
          },
        },
      },
    })
  }

  async blockUser(
    blockerUserId: number,
    blockedUserId: number,
    blockType: EBlockType
  ): Promise<void> {
    await this.createBlockedUser(blockerUserId, blockedUserId, blockType)
  }

  async checkBlockedUser(
    userId: number,
    otherUserId: number
  ): Promise<TBlockedUserFullInfo | null> {
    return await this.findBlockedUser(userId, otherUserId)
  }

  async unblockUser(userId: number, otherUserId: number): Promise<void> {
    // Kiểm tra xem user có phải là người chặn không
    const blockedUser = await this.prismaService.blockedUser.findFirst({
      where: {
        blockerUserId: userId,
      },
    })
    if (!blockedUser) throw new BadRequestException(EUserMessages.YOU_ARE_NOT_BLOCKER)

    await this.prismaService.blockedUser.deleteMany({
      where: {
        OR: [
          { blockerUserId: userId, blockedUserId: otherUserId },
          { blockerUserId: otherUserId, blockedUserId: userId },
        ],
      },
    })
  }
}

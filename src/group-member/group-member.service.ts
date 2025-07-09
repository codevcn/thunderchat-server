import { PrismaService } from '@/configs/db/prisma.service'
import { EGroupChatMessages } from '@/group-chat/group-chat.message'
import type {
  TGroupChatMember,
  TGroupChatMemberWithUser,
} from '@/utils/entities/group-chat-member.entity'
import { EProviderTokens } from '@/utils/enums'
import { Inject, Injectable, NotFoundException } from '@nestjs/common'

@Injectable()
export class GroupMemberService {
  constructor(@Inject(EProviderTokens.PRISMA_CLIENT) private prismaService: PrismaService) {}

  async fetchGroupChatMembers(groupChatId: number): Promise<TGroupChatMemberWithUser[]> {
    const members = await this.prismaService.groupChatMember.findMany({
      where: { groupChatId },
      include: {
        User: {
          include: { Profile: true },
        },
      },
    })
    return members
  }

  async searchGroupChatMembers(
    groupChatId: number,
    keyword: string
  ): Promise<TGroupChatMemberWithUser[]> {
    const members = await this.prismaService.groupChatMember.findMany({
      where: {
        groupChatId,
        OR: [
          { User: { Profile: { fullName: { contains: keyword, mode: 'insensitive' } } } },
          { User: { email: { contains: keyword, mode: 'insensitive' } } },
        ],
      },
      include: {
        User: { include: { Profile: true } },
      },
    })
    return members
  }

  async removeGroupChatMember(groupChatId: number, memberId: number): Promise<void> {
    await this.prismaService.groupChatMember.delete({
      where: { groupChatId_userId: { groupChatId, userId: memberId } },
    })
  }

  async getGroupChatMember(groupChatId: number, userId: number): Promise<TGroupChatMember | null> {
    return await this.prismaService.groupChatMember.findFirst({
      where: { groupChatId, userId },
    })
  }
}

import { PrismaService } from '@/configs/db/prisma.service'
import { EGroupChatMessages } from '@/group-chat/group-chat.message'
import { EGroupChatRoles } from '@/group-chat/group-chat.enum'
import { EProviderTokens } from '@/utils/enums'
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Inject } from '@nestjs/common'
import crypto from 'crypto'
import type {
  TCreateNewInviteLink,
  TGenerateInviteLink,
  TJoinGroupChatByInviteLink,
} from './group-chat.type'

@Injectable()
export class InviteLinkService {
  constructor(@Inject(EProviderTokens.PRISMA_CLIENT) private prismaService: PrismaService) {}

  private generateInviteLink(groupChatId: number): TGenerateInviteLink {
    const randomHash = crypto.randomBytes(8).toString('hex')
    const token = `${randomHash}-${groupChatId}`
    return { token }
  }

  async createNewInviteLinkForGroupChat(groupChatId: number): Promise<TCreateNewInviteLink> {
    const group = await this.prismaService.groupChat.findUnique({
      where: { id: groupChatId },
      include: { Members: true },
    })
    if (!group) throw new NotFoundException(EGroupChatMessages.GROUP_CHAT_NOT_FOUND)

    const { token } = this.generateInviteLink(groupChatId)

    await this.prismaService.groupChat.update({
      where: { id: groupChatId },
      data: { inviteCode: token },
    })

    return { inviteCode: token }
  }

  async joinGroupChatByInviteLink(
    token: string,
    userId: number
  ): Promise<TJoinGroupChatByInviteLink> {
    const group = await this.prismaService.groupChat.findUnique({
      where: { inviteCode: token },
    })
    if (!group) throw new NotFoundException(EGroupChatMessages.INVALID_INVITE_LINK)
    const groupChatId = group.id
    const exists = await this.prismaService.groupChatMember.findUnique({
      where: {
        groupChatId_userId: { groupChatId, userId },
      },
    })
    if (exists) {
      return {
        groupChatId,
        message: EGroupChatMessages.USER_ALREADY_IN_GROUP_CHAT,
      }
    }
    await this.prismaService.groupChatMember.create({
      data: {
        groupChatId,
        userId,
        joinedBy: userId, // tự join
        role: EGroupChatRoles.MEMBER,
      },
    })
    return { groupChatId }
  }
}

import { PrismaService } from '@/configs/db/prisma.service'
import { S3UploadService } from '@/upload/s3-upload.service'
import { EInternalEvents, EProviderTokens } from '@/utils/enums'
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import type {
  TFetchGroupChatData,
  TFetchGroupChatsData,
  TUploadGroupChatAvatar,
} from './group-chat.type'
import { UpdateGroupChatDTO } from './group-chat.dto'
import { EGroupChatMessages } from './group-chat.message'
import { EGroupChatRoles } from './group-chat.enum'
import type { TGroupChat } from '@/utils/entities/group-chat.entity'
import { TUserWithProfile } from '@/utils/entities/user.entity'
import { EventEmitter2 } from '@nestjs/event-emitter'
import type { TGroupChatMemberWithUser } from '@/utils/entities/group-chat-member.entity'

@Injectable()
export class GroupChatService {
  constructor(
    private readonly s3UploadService: S3UploadService,
    @Inject(EProviderTokens.PRISMA_CLIENT) private prismaService: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async findGroupChatById(groupId: number): Promise<TGroupChat | null> {
    const groupChat = await this.prismaService.groupChat.findUnique({
      where: { id: groupId },
    })
    return groupChat
  }

  async uploadGroupChatAvatar(avatar: Express.Multer.File): Promise<TUploadGroupChatAvatar> {
    const uploadedFile = await this.s3UploadService.uploadGroupChatAvatar(avatar)
    const avatarUrl = uploadedFile.url
    if (!avatarUrl) {
      throw new InternalServerErrorException(EGroupChatMessages.FAILED_TO_UPDATE_GROUP_CHAT_AVATAR)
    }
    return { avatarUrl }
  }

  async deleteGroupChatAvatar(avatarUrl: string): Promise<void> {
    await this.s3UploadService.deleteGroupChatAvatar(avatarUrl)
  }

  async createGroupChat(
    creator: TUserWithProfile,
    groupName: string,
    memberIds: number[],
    avatarUrl?: string
  ): Promise<TGroupChat> {
    const { id: creatorId } = creator
    const allMemberIds = [creatorId, ...memberIds]
    const groupChat = await this.prismaService.groupChat.create({
      data: {
        name: groupName,
        avatarUrl,
        creatorId,
        Members: {
          create: allMemberIds.map((memberId) => ({
            userId: memberId,
            role: memberId === creatorId ? EGroupChatRoles.ADMIN : EGroupChatRoles.MEMBER,
          })),
        },
      },
    })
    this.eventEmitter.emit(EInternalEvents.CREATE_GROUP_CHAT, groupChat, allMemberIds, creator)
    return groupChat
  }

  async fetchGroupChat(groupChatId: number, userId: number): Promise<TFetchGroupChatData> {
    const groupChat = await this.prismaService.groupChat.findFirst({
      where: {
        id: groupChatId,
        Members: {
          some: {
            userId,
          },
        },
      },
      include: {
        Members: {
          include: {
            User: {
              include: {
                Profile: true,
              },
            },
          },
        },
      },
    })
    if (!groupChat) {
      throw new NotFoundException(EGroupChatMessages.GROUP_CHAT_NOT_FOUND)
    }
    return groupChat
  }

  async findGroupChatsByUser(
    userId: number,
    lastId?: number,
    limit: number = 20
  ): Promise<TFetchGroupChatsData[]> {
    // Lấy các direct chat mà user là creator hoặc recipient
    const findCondition: Prisma.GroupChatWhereInput = {
      Members: {
        some: {
          userId,
        },
      },
    }
    if (lastId) {
      // Giả sử muốn lấy các direct chat có id < lastId (phân trang lùi)
      findCondition.id = { lt: lastId }
    }
    return await this.prismaService.groupChat.findMany({
      where: findCondition,
      orderBy: [{ LastSentMessage: { createdAt: 'desc' } }, { id: 'desc' }],
      take: limit,
      include: {
        LastSentMessage: true,
        Creator: {
          include: { Profile: true },
        },
      },
    })
  }

  async updateGroupChat(
    groupChatId: number,
    userId: number,
    updates: Partial<UpdateGroupChatDTO>
  ): Promise<TGroupChat> {
    const { avatarUrl, groupName } = updates
    const groupChat = await this.prismaService.groupChat.update({
      where: { id: groupChatId, creatorId: userId },
      data: { avatarUrl, name: groupName },
    })
    return groupChat
  }

  async checkIfMembersInGroupChat(groupChatId: number, memberIds: number[]): Promise<boolean> {
    const groupChatMembers = await this.prismaService.groupChatMember.findMany({
      where: { groupChatId, userId: { in: memberIds } },
    })
    return groupChatMembers.length > 0
  }

  async addMembersToGroupChat(
    groupChatId: number,
    memberIds: number[]
  ): Promise<TGroupChatMemberWithUser[]> {
    const isMembersInGroupChat = await this.checkIfMembersInGroupChat(groupChatId, memberIds)
    if (isMembersInGroupChat) {
      throw new BadRequestException(EGroupChatMessages.MEMBERS_ALREADY_IN_GROUP_CHAT)
    }
    await this.prismaService.groupChat.update({
      where: { id: groupChatId },
      data: {
        Members: {
          create: memberIds.map((memberId) => ({ userId: memberId })),
        },
      },
    })
    const addedMembers = await this.prismaService.groupChatMember.findMany({
      where: { groupChatId, userId: { in: memberIds } },
      include: { User: { include: { Profile: true } } },
    })
    return addedMembers
  }
}

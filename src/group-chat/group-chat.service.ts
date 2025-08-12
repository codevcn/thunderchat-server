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
  TFetchGroupChatPermissionsRes,
  TFetchGroupChatsData,
  TUploadGroupChatAvatar,
} from './group-chat.type'
import { GroupChatPermissionsDTO, UpdateGroupChatDTO } from './group-chat.dto'
import { EGroupChatMessages } from './group-chat.message'
import { EGroupChatPermissions, EGroupChatRoles } from './group-chat.enum'
import type { TGroupChat, TGroupChatWithCreator } from '@/utils/entities/group-chat.entity'
import { TUserWithProfile } from '@/utils/entities/user.entity'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { GroupMemberService } from '@/group-member/group-member.service'
import { EGroupMemberMessages } from '@/group-member/group-member.message'
import { typeToRawObject } from '@/utils/helpers'
import type { Express } from 'express'

@Injectable()
export class GroupChatService {
  private readonly MIN_GROUP_CHAT_NAME_LENGTH: number = 2
  private readonly MIN_GROUP_CHAT_MEMBERS_COUNT: number = 2

  constructor(
    private readonly s3UploadService: S3UploadService,
    @Inject(EProviderTokens.PRISMA_CLIENT) private prismaService: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly groupMemberService: GroupMemberService
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
    if (groupName.length < this.MIN_GROUP_CHAT_NAME_LENGTH) {
      throw new BadRequestException(EGroupChatMessages.GROUP_NAME_TOO_SHORT)
    }
    if (allMemberIds.length < this.MIN_GROUP_CHAT_MEMBERS_COUNT) {
      throw new BadRequestException(EGroupChatMessages.GROUP_MEMBERS_TOO_FEW)
    }
    const groupChat = await this.prismaService.groupChat.create({
      data: {
        name: groupName,
        avatarUrl,
        creatorId,
        Members: {
          create: allMemberIds.map((memberId) => ({
            userId: memberId,
            role: memberId === creatorId ? EGroupChatRoles.ADMIN : EGroupChatRoles.MEMBER,
            joinedBy: creatorId,
          })),
        },
        GroupChatPermission: {
          create: {
            sendMessage: true,
            pinMessage: true,
            shareInviteCode: true,
            updateInfo: true,
          },
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
            JoinedBy: {
              include: {
                Profile: true,
              },
            },
          },
        },
      },
    })
    if (!groupChat) {
      throw new NotFoundException(EGroupChatMessages.GROUP_CHAT_NOT_FOUND_OR_NOT_A_MEMBER)
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
    const member = await this.groupMemberService.getGroupChatMember(groupChatId, userId)
    if (!member) {
      throw new NotFoundException(EGroupMemberMessages.MEMBER_INFO_NOT_FOUND)
    }
    if (member.role !== EGroupChatRoles.ADMIN) {
      const permission = await this.checkGroupChatPermission(
        groupChatId,
        EGroupChatPermissions.UPDATE_INFO
      )
      if (!permission) {
        throw new BadRequestException(EGroupChatMessages.USER_HAS_NO_PERMISSION_UPDATE_GROUP_CHAT)
      }
    }
    const { avatarUrl, groupName } = updates
    const groupChat = await this.prismaService.groupChat.update({
      where: { id: groupChatId },
      data: { avatarUrl, name: groupName },
    })
    this.eventEmitter.emit(
      EInternalEvents.UPDATE_GROUP_CHAT_INFO,
      groupChatId,
      typeToRawObject<Partial<TGroupChat>>({
        avatarUrl,
        name: groupName,
      })
    )
    return groupChat
  }

  async updateGroupChatPermissions(
    groupChatId: number,
    permissions: GroupChatPermissionsDTO
  ): Promise<void> {
    await this.prismaService.groupChatPermission.update({
      where: { groupChatId },
      data: permissions,
    })
  }

  async checkGroupChatPermission(
    groupChatId: number,
    permission: EGroupChatPermissions
  ): Promise<boolean> {
    const groupChatPermission = await this.prismaService.groupChatPermission.findUnique({
      where: { groupChatId },
    })
    if (!groupChatPermission) return true
    return groupChatPermission[permission]
  }

  async fetchGroupChatPermissions(groupChatId: number): Promise<TFetchGroupChatPermissionsRes> {
    const groupChatPermission = await this.prismaService.groupChatPermission.findUnique({
      where: { groupChatId },
      select: {
        sendMessage: true,
        pinMessage: true,
        shareInviteCode: true,
        updateInfo: true,
      },
    })
    if (!groupChatPermission) {
      throw new NotFoundException(EGroupChatMessages.GROUP_CHAT_PERMISSION_NOT_FOUND)
    }
    return {
      permissions: groupChatPermission,
    }
  }

  async fetchGroupChatByInviteCode(inviteCode: string): Promise<TGroupChatWithCreator | null> {
    const groupChat = await this.prismaService.groupChat.findUnique({
      where: { inviteCode },
      include: {
        Creator: {
          include: {
            Profile: true,
          },
        },
      },
    })
    return groupChat
  }
}

import { PrismaService } from '@/configs/db/prisma.service'
import { S3UploadService } from '@/upload/s3-upload.service'
import { EProviderTokens } from '@/utils/enums'
import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import type { GroupChat } from '@prisma/client'
import type { TFetchGroupChatData, TUploadGroupChatAvatar } from './group-chat.type'

@Injectable()
export class GroupChatService {
  constructor(
    private readonly s3UploadService: S3UploadService,
    @Inject(EProviderTokens.PRISMA_CLIENT) private prismaService: PrismaService
  ) {}

  async uploadGroupChatAvatar(avatar: Express.Multer.File): Promise<TUploadGroupChatAvatar> {
    const uploadedFile = await this.s3UploadService.uploadGroupChatAvatar(avatar)
    const avatarUrl = uploadedFile.url
    if (!avatarUrl) {
      throw new InternalServerErrorException('Failed to update group chat avatar')
    }
    return { avatarUrl }
  }

  async deleteGroupChatAvatar(avatarUrl: string): Promise<void> {
    await this.s3UploadService.deleteGroupChatAvatar(avatarUrl)
  }

  async createGroupChat(
    groupName: string,
    memberIds: number[],
    avatarUrl?: string
  ): Promise<GroupChat> {
    const groupChat = await this.prismaService.groupChat.create({
      data: {
        name: groupName,
        avatarUrl,
        creatorId: memberIds[0],
      },
    })
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
            User: true,
          },
        },
      },
    })
    if (!groupChat) {
      throw new NotFoundException('Group chat not found')
    }
    return groupChat
  }
}

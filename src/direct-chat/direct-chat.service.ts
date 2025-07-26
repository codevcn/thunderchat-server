import type {
  TFetchDirectChatsData,
  TFindDirectChatData,
  TUpdateDirectChatData,
} from './direct-chat.type'
import { Inject, Injectable } from '@nestjs/common'
import { PrismaService } from '@/configs/db/prisma.service'
import { EProviderTokens } from '@/utils/enums'
import { Prisma } from '@prisma/client'

@Injectable()
export class DirectChatService {
  constructor(@Inject(EProviderTokens.PRISMA_CLIENT) private PrismaService: PrismaService) {}

  async findById(id: number, userId: number): Promise<TFindDirectChatData | null> {
    return await this.PrismaService.directChat.findUnique({
      where: { id, OR: [{ creatorId: userId }, { recipientId: userId }] },
      include: {
        Recipient: {
          include: {
            Profile: true,
          },
        },
        Creator: {
          include: {
            Profile: true,
          },
        },
      },
    })
  }

  async updateDirectChat(directChatId: number, updates: TUpdateDirectChatData): Promise<void> {
    await this.PrismaService.directChat.update({
      where: { id: directChatId },
      data: updates,
    })
  }

  async addLastSentMessage(directChatId: number, lastSentMessageId: number): Promise<void> {
    await this.updateDirectChat(directChatId, { lastSentMessageId })
  }

  async findDirectChatsByUser(
    userId: number,
    lastId?: number,
    limit: number = 20
  ): Promise<TFetchDirectChatsData[]> {
    // Lấy các direct chat mà user là creator hoặc recipient
    const findCondition: Prisma.DirectChatWhereInput = {
      OR: [{ creatorId: userId }, { recipientId: userId }],
    }
    if (lastId) {
      // Giả sử muốn lấy các direct chat có id < lastId (phân trang lùi)
      findCondition.id = { lt: lastId }
    }
    return await this.PrismaService.directChat.findMany({
      where: findCondition,
      orderBy: [
        { LastSentMessage: { createdAt: 'desc' } }, // Ưu tiên cuộc trò chuyện có tin nhắn gần đây nhất
        { createdAt: 'desc' }, // Nếu không có tin nhắn thì sắp xếp theo thời gian tạo
        { id: 'desc' },
      ],
      take: limit,
      include: {
        LastSentMessage: true,
        Recipient: {
          include: { Profile: true },
        },
        Creator: {
          include: { Profile: true },
        },
      },
    })
  }

  async searchDirectChatsByUser(
    userId: number,
    search?: string,
    lastId?: number,
    limit: number = 20
  ): Promise<TFetchDirectChatsData[]> {
    // Lấy các direct chat mà user là creator hoặc recipient
    const findCondition: Prisma.DirectChatWhereInput = {
      OR: [{ creatorId: userId }, { recipientId: userId }],
    }

    // Thêm điều kiện tìm kiếm nếu có search term
    if (search && search.trim()) {
      findCondition.OR = [
        {
          AND: [
            { OR: [{ creatorId: userId }, { recipientId: userId }] },
            {
              OR: [
                {
                  Creator: {
                    Profile: {
                      fullName: { contains: search, mode: 'insensitive' },
                    },
                  },
                },
                {
                  Recipient: {
                    Profile: {
                      fullName: { contains: search, mode: 'insensitive' },
                    },
                  },
                },
              ],
            },
          ],
        },
      ]
    }

    if (lastId) {
      // Giả sử muốn lấy các direct chat có id < lastId (phân trang lùi)
      findCondition.id = { lt: lastId }
    }

    return await this.PrismaService.directChat.findMany({
      where: findCondition,
      orderBy: [
        { LastSentMessage: { createdAt: 'desc' } }, // Ưu tiên cuộc trò chuyện có tin nhắn gần đây nhất
        { createdAt: 'desc' }, // Nếu không có tin nhắn thì sắp xếp theo thời gian tạo
        { id: 'desc' },
      ],
      take: limit,
      include: {
        LastSentMessage: true,
        Recipient: {
          include: { Profile: true },
        },
        Creator: {
          include: { Profile: true },
        },
      },
    })
  }

  async createDirectChat(creatorId: number, recipientId: number) {
    // Kiểm tra đã có direct chat chưa
    const existing = await this.PrismaService.directChat.findFirst({
      where: {
        OR: [
          { creatorId, recipientId },
          { creatorId: recipientId, recipientId: creatorId },
        ],
      },
    })
    if (existing) return existing // Nếu đã có thì trả về luôn

    // Nếu chưa có thì tạo mới
    return await this.PrismaService.directChat.create({
      data: {
        creatorId,
        recipientId,
      },
      include: {
        Recipient: { include: { Profile: true } },
        Creator: { include: { Profile: true } },
      },
    })
  }
}

import { Injectable, Inject, forwardRef } from '@nestjs/common'
import { PrismaService } from '../../configs/db/prisma.service'
import { EProviderTokens } from '@/utils/enums'
import { SocketService } from '@/gateway/socket/socket.service'
import { EClientSocketEvents } from '@/gateway/gateway.event'

@Injectable()
export class PinDirectChatService {
  constructor(
    @Inject(EProviderTokens.PRISMA_CLIENT) private prismaService: PrismaService,
    @Inject(forwardRef(() => SocketService)) private socketService: SocketService
  ) {}

  /**
   * Ghim hoặc bỏ ghim cuộc trò chuyện riêng lẻ cho user cụ thể
   * @param directChatId ID của cuộc trò chuyện
   * @param userId ID của user thực hiện hành động
   * @param isPinned Trạng thái ghim (true: ghim, false: bỏ ghim)
   */
  async pinOrUnpinDirectChat(directChatId: number, userId: number, isPinned: boolean) {
    // Kiểm tra xem cuộc trò chuyện có tồn tại không
    const directChat = await this.prismaService.directChat.findUnique({
      where: { id: directChatId },
      include: {
        Creator: { include: { Profile: true } },
        Recipient: { include: { Profile: true } },
      },
    })

    if (!directChat) {
      throw new Error('Cuộc trò chuyện không tồn tại!')
    }

    // Kiểm tra xem user có tham gia cuộc trò chuyện này không
    if (directChat.creatorId !== userId && directChat.recipientId !== userId) {
      throw new Error('Bạn không có quyền thực hiện hành động này!')
    }

    if (isPinned) {
      // Kiểm tra xem cuộc trò chuyện đã được ghim chưa
      const existingPin = await this.prismaService.pinnedChat.findFirst({
        where: {
          directChatId,
          pinnedBy: userId,
        },
      })

      if (existingPin) {
        throw new Error('Cuộc trò chuyện này đã được ghim!')
      }

      // Đếm số lượng cuộc trò chuyện đã ghim của user
      const count = await this.prismaService.pinnedChat.count({
        where: {
          pinnedBy: userId,
        },
      })

      if (count >= 5) {
        throw new Error('Bạn chỉ được ghim tối đa 5 cuộc trò chuyện!')
      }

      // Tạo pin mới
      const pinnedDirectChat = await this.prismaService.pinnedChat.create({
        data: {
          directChatId,
          pinnedBy: userId,
        },
        include: {
          DirectChat: {
            include: {
              Creator: { include: { Profile: true } },
              Recipient: { include: { Profile: true } },
              LastSentMessage: {
                include: {
                  Author: { include: { Profile: true } },
                },
              },
            },
          },
        },
      })

      // Gửi socket event cho user
      this.socketService.emitToUser(userId, EClientSocketEvents.pin_direct_chat, {
        directChatId,
        isPinned: true,
        pinnedDirectChat,
      })

      return pinnedDirectChat
    } else {
      // Bỏ ghim - xóa record trong PinnedDirectChat
      const deletedPin = await this.prismaService.pinnedChat.deleteMany({
        where: {
          directChatId,
          pinnedBy: userId,
        },
      })

      if (deletedPin.count === 0) {
        throw new Error('Cuộc trò chuyện này chưa được ghim!')
      }

      // Gửi socket event cho user
      this.socketService.emitToUser(userId, EClientSocketEvents.pin_direct_chat, {
        directChatId,
        isPinned: false,
      })

      return { success: true, deletedCount: deletedPin.count }
    }
  }

  /**
   * Lấy danh sách cuộc trò chuyện đã ghim của user
   * @param userId ID của user
   */
  async getPinnedDirectChats(userId: number) {
    return this.prismaService.pinnedChat.findMany({
      where: {
        pinnedBy: userId,
      },
      include: {
        DirectChat: {
          include: {
            Creator: { include: { Profile: true } },
            Recipient: { include: { Profile: true } },
            LastSentMessage: {
              include: {
                Author: { include: { Profile: true } },
              },
            },
          },
        },
      },
      orderBy: { pinnedAt: 'desc' },
    })
  }

  /**
   * Lấy số lượng cuộc trò chuyện đã ghim của user
   * @param userId ID của user
   */
  async getPinnedDirectChatsCount(userId: number) {
    return this.prismaService.pinnedChat.count({
      where: {
        pinnedBy: userId,
      },
    })
  }

  /**
   * Kiểm tra xem cuộc trò chuyện có được ghim bởi user không
   * @param directChatId ID của cuộc trò chuyện
   * @param userId ID của user
   */
  async isDirectChatPinned(directChatId: number, userId: number) {
    const pinnedDirectChat = await this.prismaService.pinnedChat.findFirst({
      where: {
        directChatId,
        pinnedBy: userId,
      },
    })
    return !!pinnedDirectChat
  }

  /**
   * Lấy thông tin chi tiết về cuộc trò chuyện đã ghim
   * @param directChatId ID của cuộc trò chuyện
   * @param userId ID của user
   */
  async getPinnedDirectChatDetail(directChatId: number, userId: number) {
    return this.prismaService.pinnedChat.findFirst({
      where: {
        directChatId,
        pinnedBy: userId,
      },
      include: {
        DirectChat: {
          include: {
            Creator: { include: { Profile: true } },
            Recipient: { include: { Profile: true } },
            LastSentMessage: {
              include: {
                Author: { include: { Profile: true } },
              },
            },
          },
        },
      },
    })
  }
}

import { Injectable, Inject, forwardRef } from '@nestjs/common'
import { PrismaService } from '../../configs/db/prisma.service'
import { EProviderTokens } from '@/utils/enums'
import { SocketService } from '@/gateway/socket/socket.service'
import { EClientSocketEvents } from '@/gateway/gateway.event'

@Injectable()
export class PinService {
  constructor(
    @Inject(EProviderTokens.PRISMA_CLIENT) private prismaService: PrismaService,
    @Inject(forwardRef(() => SocketService)) private socketService: SocketService
  ) {
    // Inject PrismaService để thao tác database
    // Inject SocketService để gửi real-time events
  }

  /**
   * Ghim hoặc bỏ ghim tin nhắn trong direct chat (đồng bộ cho tất cả user)
   * @param messageId ID của tin nhắn
   * @param directChatId ID của cuộc trò chuyện
   * @param userId ID của user thực hiện hành động (để ghi nhận và socket event)
   * @param isPinned Trạng thái ghim (true: ghim, false: bỏ ghim)
   */
  async pinOrUnpinMessage(
    messageId: number,
    directChatId: number,
    userId: number,
    isPinned: boolean
  ) {
    if (isPinned) {
      // Kiểm tra xem tin nhắn đã được ghim chưa (cho bất kỳ ai trong cuộc trò chuyện)
      const existingPin = await this.prismaService.pinnedDirectMessage.findFirst({
        where: {
          messageId,
          directChatId,
        },
      })

      if (existingPin) {
        throw new Error('Tin nhắn này đã được ghim!')
      }

      // Đếm số lượng tin nhắn đã ghim trong directChatId (tổng cộng cho tất cả user)
      const count = await this.prismaService.pinnedDirectMessage.count({
        where: {
          directChatId,
        },
      })

      if (count >= 5) {
        throw new Error('Chỉ được ghim tối đa 5 tin nhắn trong một cuộc trò chuyện!')
      }

      // Tạo pin mới (ghi nhận người đầu tiên ghim)
      const pinnedMessage = await this.prismaService.pinnedDirectMessage.create({
        data: {
          messageId,
          directChatId,
          pinnedBy: userId,
        },
        include: {
          DirectMessage: {
            include: {
              Author: {
                include: {
                  Profile: true,
                },
              },
            },
          },
        },
      })

      // PHÁT SOCKET EVENT ĐẾN TẤT CẢ CLIENT CÙNG PHÒNG
      this.socketService.emitToDirectChat(directChatId, EClientSocketEvents.pin_message, {
        messageId,
        directChatId,
        isPinned: true,
        userId,
        pinnedMessage,
      })

      return pinnedMessage
    } else {
      // Bỏ ghim - xóa record trong PinnedDirectMessage (cho tất cả user)
      const deletedPin = await this.prismaService.pinnedDirectMessage.deleteMany({
        where: {
          messageId,
          directChatId,
        },
      })

      // PHÁT SOCKET EVENT ĐẾN TẤT CẢ CLIENT CÙNG PHÒNG
      this.socketService.emitToDirectChat(directChatId, EClientSocketEvents.pin_message, {
        messageId,
        directChatId,
        isPinned: false,
        userId,
      })

      return { success: true, deletedCount: deletedPin.count }
    }
  }

  /**
   * Lấy danh sách tin nhắn đã ghim trong direct chat (cho tất cả user trong cuộc trò chuyện)
   * @param directChatId ID của cuộc trò chuyện
   * @param userId ID của user (để tương thích API, không sử dụng trong logic)
   */
  async getPinnedMessages(directChatId: number, userId: number) {
    return this.prismaService.pinnedDirectMessage.findMany({
      where: {
        directChatId,
      },
      include: {
        DirectMessage: {
          include: {
            Author: {
              include: {
                Profile: true,
              },
            },
            ReplyTo: {
              include: {
                Author: {
                  include: {
                    Profile: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { pinnedAt: 'desc' },
      take: 5,
    })
  }

  /**
   * Lấy số lượng tin nhắn đã ghim trong direct chat (tổng cộng cho tất cả user)
   * @param directChatId ID của cuộc trò chuyện
   * @param userId ID của user (để tương thích API, không sử dụng trong logic)
   */
  async getPinnedCount(directChatId: number, userId: number) {
    return this.prismaService.pinnedDirectMessage.count({
      where: {
        directChatId,
      },
    })
  }

  /**
   * Kiểm tra xem tin nhắn có được ghim trong cuộc trò chuyện không
   * @param messageId ID của tin nhắn
   * @param directChatId ID của cuộc trò chuyện
   * @param userId ID của user (để tương thích API, không sử dụng trong logic)
   */
  async isMessagePinned(messageId: number, directChatId: number, userId: number) {
    const pinnedMessage = await this.prismaService.pinnedDirectMessage.findFirst({
      where: {
        messageId,
        directChatId,
      },
    })
    return !!pinnedMessage
  }
}

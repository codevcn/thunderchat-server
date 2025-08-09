import { Injectable, Inject, forwardRef, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../configs/db/prisma.service'
import { EProviderTokens } from '@/utils/enums'
import { SocketService } from '@/gateway/socket/socket.service'
import { EClientSocketEvents } from '@/gateway/gateway.event'
import { EMessageMediaTypes, EMessageStatus, EMessageTypes } from '../direct-message.enum'
import type { TMessageWithMedia } from '@/utils/entities/message.entity'
import { EPinMessages } from './pin.message'
import { createGroupChatRoomName } from '@/utils/helpers'

// Helper mô tả nội dung tin nhắn
function getMessageDescription(message: TMessageWithMedia): string {
  switch (message.Media?.type) {
    case EMessageMediaTypes.IMAGE:
      return 'hình ảnh'
    case EMessageMediaTypes.VIDEO:
      return 'video'
    case EMessageMediaTypes.DOCUMENT:
      return message.Media?.fileName ? `file: ${message.Media.fileName}` : 'file'
    case EMessageMediaTypes.AUDIO:
      return 'audio'
  }
  switch (message.type) {
    case EMessageTypes.STICKER:
      return 'sticker'
    case EMessageTypes.TEXT:
      return message.content
  }
  return message.content
}

@Injectable()
export class PinService {
  constructor(
    @Inject(EProviderTokens.PRISMA_CLIENT) private prismaService: PrismaService,
    @Inject(forwardRef(() => SocketService)) private socketService: SocketService
  ) {}

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
      const existingPin = await this.prismaService.pinnedMessage.findFirst({
        where: {
          messageId,
          directChatId,
        },
      })

      if (existingPin) {
        throw new BadRequestException(EPinMessages.MESSAGE_ALREADY_PINNED)
      }

      // Đếm số lượng tin nhắn đã ghim trong directChatId (tổng cộng cho tất cả user)
      const count = await this.prismaService.pinnedMessage.count({
        where: {
          directChatId,
        },
      })

      if (count >= 5) {
        throw new BadRequestException(EPinMessages.CANNOT_PIN_MORE_THAN_5_MESSAGES)
      }

      // Tạo pin mới (ghi nhận người đầu tiên ghim)
      const pinnedMessage = await this.prismaService.pinnedMessage.create({
        data: {
          messageId,
          directChatId,
          pinnedBy: userId,
        },
        include: {
          Message: {
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

      // Lấy tên người thực hiện
      const userProfile = await this.prismaService.profile.findUnique({
        where: { userId },
      })
      const fullName = userProfile?.fullName || 'Người dùng'

      // Lấy nội dung tin nhắn gốc
      const originalMessage = await this.prismaService.message.findUnique({
        where: { id: messageId },
        include: {
          Media: true,
        },
      })
      const originalMessageDescription = originalMessage
        ? getMessageDescription(originalMessage)
        : ''

      // Lấy thông tin direct chat để xác định recipientId đúng
      const directChat = await this.prismaService.directChat.findUnique({
        where: { id: directChatId },
      })
      let recipientId = userId
      if (directChat) {
        recipientId =
          directChat.creatorId === userId ? directChat.recipientId : directChat.creatorId
      }

      // Tạo message thông báo
      const pinNoticeMessage = await this.prismaService.message.create({
        data: {
          content: `${fullName} đã ghim tin nhắn: ${originalMessageDescription}`,
          authorId: userId,
          recipientId,
          directChatId,
          type: EMessageTypes.PIN_NOTICE,
          status: EMessageStatus.SENT,
          replyToId: messageId, // Liên kết tới tin nhắn gốc
        },
        include: {
          Author: { include: { Profile: true } },
          ReplyTo: { include: { Author: { include: { Profile: true } } } },
        },
      })

      // Emit socket event gửi message mới cho cả 2 user
      this.socketService.emitToDirectChat(
        directChatId,
        EClientSocketEvents.send_message_direct,
        pinNoticeMessage
      )

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
      const deletedPin = await this.prismaService.pinnedMessage.deleteMany({
        where: {
          messageId,
          directChatId,
        },
      })

      // Lấy tên người thực hiện
      const userProfile = await this.prismaService.profile.findUnique({
        where: { userId },
      })
      const fullName = userProfile?.fullName || 'Người dùng'

      // Lấy nội dung tin nhắn gốc
      const originalMessage = await this.prismaService.message.findUnique({
        where: { id: messageId },
        include: {
          Media: true,
        },
      })
      const originalMessageDescription = originalMessage
        ? getMessageDescription(originalMessage)
        : ''

      // Lấy thông tin direct chat để xác định recipientId đúng
      const directChat = await this.prismaService.directChat.findUnique({
        where: { id: directChatId },
      })
      let recipientId = userId
      if (directChat) {
        recipientId =
          directChat.creatorId === userId ? directChat.recipientId : directChat.creatorId
      }

      // Tạo message thông báo
      const pinNoticeMessage = await this.prismaService.message.create({
        data: {
          content: `${fullName} đã bỏ ghim tin nhắn: ${originalMessageDescription}`,
          authorId: userId,
          recipientId,
          directChatId,
          type: EMessageTypes.PIN_NOTICE,
          status: EMessageStatus.SENT,
        },
        include: {
          Author: { include: { Profile: true } },
          ReplyTo: { include: { Author: { include: { Profile: true } } } },
        },
      })

      // Emit socket event gửi message mới cho cả 2 user
      this.socketService.emitToDirectChat(
        directChatId,
        EClientSocketEvents.send_message_direct,
        pinNoticeMessage
      )

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
   * @param groupChatId ID của nhóm
   */
  async getPinnedMessages(directChatId?: number, groupChatId?: number) {
    if (directChatId && groupChatId) {
      throw new BadRequestException(EPinMessages.INVALID_PARAMS)
    }
    if (!directChatId && !groupChatId) {
      throw new BadRequestException(EPinMessages.INVALID_PARAMS)
    }
    return this.prismaService.pinnedMessage.findMany({
      where: {
        directChatId,
        groupChatId,
      },
      include: {
        Message: {
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
            Media: true,
            Sticker: true,
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
   * @param groupChatId ID của nhóm
   */
  async getPinnedCount(directChatId?: number, groupChatId?: number) {
    if (directChatId && groupChatId) {
      throw new BadRequestException(EPinMessages.INVALID_PARAMS)
    }
    if (!directChatId && !groupChatId) {
      throw new BadRequestException(EPinMessages.INVALID_PARAMS)
    }
    return this.prismaService.pinnedMessage.count({
      where: {
        directChatId,
        groupChatId,
      },
    })
  }

  /**
   * Kiểm tra xem tin nhắn có được ghim trong cuộc trò chuyện không
   * @param messageId ID của tin nhắn
   * @param directChatId ID của cuộc trò chuyện
   * @param groupChatId ID của nhóm
   */
  async isMessagePinned(messageId: number, directChatId?: number, groupChatId?: number) {
    if (directChatId && groupChatId) {
      throw new BadRequestException(EPinMessages.INVALID_PARAMS)
    }
    if (!directChatId && !groupChatId) {
      throw new BadRequestException(EPinMessages.INVALID_PARAMS)
    }
    const pinnedMessage = await this.prismaService.pinnedMessage.findFirst({
      where: {
        messageId,
        directChatId,
        groupChatId,
      },
    })
    return !!pinnedMessage
  }

  async pinOrUnpinMessageInGroupChat(
    messageId: number,
    groupChatId: number,
    userId: number,
    isPinned: boolean
  ) {
    if (isPinned) {
      // Kiểm tra xem tin nhắn đã được ghim chưa (cho bất kỳ ai trong cuộc trò chuyện)
      const existingPin = await this.prismaService.pinnedMessage.findFirst({
        where: {
          messageId,
          groupChatId,
        },
      })
      if (existingPin) {
        throw new BadRequestException(EPinMessages.MESSAGE_ALREADY_PINNED)
      }

      // Đếm số lượng tin nhắn đã ghim trong directChatId (tổng cộng cho tất cả user)
      const count = await this.prismaService.pinnedMessage.count({
        where: {
          groupChatId,
        },
      })

      if (count >= 5) {
        throw new BadRequestException(EPinMessages.CANNOT_PIN_MORE_THAN_5_MESSAGES)
      }

      // Tạo pin mới (ghi nhận người đầu tiên ghim)
      const pinnedMessage = await this.prismaService.pinnedMessage.create({
        data: {
          messageId,
          groupChatId,
          pinnedBy: userId,
        },
        include: {
          Message: {
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

      // Lấy tên người thực hiện
      const userProfile = await this.prismaService.profile.findUnique({
        where: { userId },
      })
      const fullName = userProfile?.fullName || 'Người dùng'

      // Lấy nội dung tin nhắn gốc
      const originalMessage = await this.prismaService.message.findUnique({
        where: { id: messageId },
        include: {
          Media: true,
        },
      })
      const originalMessageDescription = originalMessage
        ? getMessageDescription(originalMessage)
        : ''

      // Tạo message thông báo
      const pinNoticeMessage = await this.prismaService.message.create({
        data: {
          content: `${fullName} đã ghim tin nhắn: ${originalMessageDescription}`,
          authorId: userId,
          groupChatId,
          type: EMessageTypes.PIN_NOTICE,
          status: EMessageStatus.SENT,
          replyToId: messageId, // Liên kết tới tin nhắn gốc
        },
        include: {
          Author: { include: { Profile: true } },
          ReplyTo: {
            include: {
              Author: { include: { Profile: true } },
              Media: true,
              Sticker: true,
            },
          },
          Media: true,
          Sticker: true,
        },
      })

      // Emit socket event gửi message mới cho cả thành viên trong group
      this.socketService.sendNewMessageToGroupChat(groupChatId, pinNoticeMessage)

      // PHÁT SOCKET EVENT ĐẾN TẤT CẢ CLIENT CÙNG PHÒNG
      this.socketService
        .getServer()
        .to(createGroupChatRoomName(groupChatId))
        .emit(EClientSocketEvents.pin_message_group, {
          messageId,
          groupChatId,
          isPinned: true,
          userId,
          pinnedMessage,
        })

      return pinnedMessage
    } else {
      // Bỏ ghim - xóa record trong PinnedDirectMessage (cho tất cả user)
      const deletedPin = await this.prismaService.pinnedMessage.deleteMany({
        where: {
          messageId,
          groupChatId,
        },
      })

      // Lấy tên người thực hiện
      const userProfile = await this.prismaService.profile.findUnique({
        where: { userId },
      })
      const fullName = userProfile?.fullName || 'Người dùng'

      // Lấy nội dung tin nhắn gốc
      const originalMessage = await this.prismaService.message.findUnique({
        where: { id: messageId },
        include: {
          Media: true,
        },
      })
      const originalMessageDescription = originalMessage
        ? getMessageDescription(originalMessage)
        : ''

      // Tạo message thông báo
      const pinNoticeMessage = await this.prismaService.message.create({
        data: {
          content: `${fullName} đã bỏ ghim tin nhắn: ${originalMessageDescription}`,
          authorId: userId,
          groupChatId,
          type: EMessageTypes.PIN_NOTICE,
          status: EMessageStatus.SENT,
        },
        include: {
          Author: { include: { Profile: true } },
          ReplyTo: {
            include: {
              Author: { include: { Profile: true } },
              Media: true,
              Sticker: true,
            },
          },
          Media: true,
          Sticker: true,
        },
      })

      // Emit socket event gửi message mới cho cả 2 user
      this.socketService.sendNewMessageToGroupChat(groupChatId, pinNoticeMessage)

      // PHÁT SOCKET EVENT ĐẾN TẤT CẢ CLIENT CÙNG PHÒNG
      this.socketService
        .getServer()
        .to(createGroupChatRoomName(groupChatId))
        .emit(EClientSocketEvents.pin_message_group, {
          messageId: pinNoticeMessage.id,
          groupChatId,
          isPinned: false,
          userId,
        })

      return { success: true, deletedCount: deletedPin.count }
    }
  }
}

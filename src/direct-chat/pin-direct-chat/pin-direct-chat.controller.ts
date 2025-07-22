import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common'
import { PinDirectChatService } from './pin-direct-chat.service'
import { PinDirectChatDTO } from './pin-direct-chat.dto.js'
import { AuthGuard } from '@/auth/auth.guard'
import { User } from '@/user/user.decorator'

// Controller quản lý chức năng ghim cuộc trò chuyện riêng lẻ cho từng user

@Controller('pin-direct-chat')
@UseGuards(AuthGuard)
export class PinDirectChatController {
  constructor(private pinDirectChatService: PinDirectChatService) {}

  @Post('pin')
  async pinOrUnpinDirectChat(@Body() body: PinDirectChatDTO, @User('id') userId: number) {
    const { directChatId, isPinned } = body
    // Ghim/bỏ ghim cuộc trò chuyện riêng lẻ cho user cụ thể
    return await this.pinDirectChatService.pinOrUnpinDirectChat(directChatId, userId, isPinned)
  }

  @Get('pinned-chats')
  async getPinnedDirectChats(@User('id') userId: number) {
    // Lấy danh sách cuộc trò chuyện đã ghim của user
    return await this.pinDirectChatService.getPinnedDirectChats(userId)
  }

  @Get('pinned-count')
  async getPinnedDirectChatsCount(@User('id') userId: number) {
    // Lấy số lượng cuộc trò chuyện đã ghim của user
    return await this.pinDirectChatService.getPinnedDirectChatsCount(userId)
  }

  @Get('is-pinned')
  async isDirectChatPinned(
    @Query('directChatId') directChatId: number,
    @User('id') userId: number
  ) {
    // Kiểm tra cuộc trò chuyện có được ghim bởi user không
    return await this.pinDirectChatService.isDirectChatPinned(Number(directChatId), userId)
  }

  @Get('pinned-detail')
  async getPinnedDirectChatDetail(
    @Query('directChatId') directChatId: number,
    @User('id') userId: number
  ) {
    // Lấy thông tin chi tiết về cuộc trò chuyện đã ghim
    return await this.pinDirectChatService.getPinnedDirectChatDetail(Number(directChatId), userId)
  }
}

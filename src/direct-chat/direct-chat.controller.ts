import { AuthGuard } from '@/auth/auth.guard'
import { DirectChatService } from '@/direct-chat/direct-chat.service'
import {
  Controller,
  Get,
  UseGuards,
  Param,
  Query,
  NotFoundException,
  Body,
  Post,
} from '@nestjs/common'
import { ERoutes } from '@/utils/enums'
import { IDirectChatsController } from './direct-chat.interface'
import {
  FetchDirectChatDTO,
  FetchDirectChatsDTO,
  CreateDirectChatDTO,
  SearchDirectChatsDTO,
} from './direct-chat.dto'
import { User } from '@/user/user.decorator'
import { TUserWithProfile } from '@/utils/entities/user.entity'
import { EDirectChatMessages } from './direct-chat.message'

@Controller(ERoutes.DIRECT_CHAT)
@UseGuards(AuthGuard)
export class DirectChatController implements IDirectChatsController {
  constructor(private conversationService: DirectChatService) {}

  @Get('fetch/:conversationId')
  async fetchDirectChat(@Param() params: FetchDirectChatDTO, @User() user: TUserWithProfile) {
    const directChat = await this.conversationService.findById(params.conversationId, user.id)
    if (!directChat) {
      throw new NotFoundException(EDirectChatMessages.DIRECT_CHAT_NOT_FOUND)
    }
    console.log('🔍 [fetchDirectChat] Result:', {
      conversationId: params.conversationId,
      userId: user.id,
      result: directChat,
    })
    return directChat
  }

  // fetch all direct chats of user
  @Get('fetch-direct-chats')
  async fetchAllDirectChats(@Query() query: FetchDirectChatsDTO, @User() user: TUserWithProfile) {
    const directChats = await this.conversationService.findDirectChatsByUser(
      user.id,
      query.lastId,
      query.limit
    )
    console.log('📋 [fetchAllDirectChats] Result:', {
      userId: user.id,
      query: { lastId: query.lastId, limit: query.limit },
      totalResults: directChats.length,
      results: directChats.map((chat) => ({
        id: chat.id,
        creatorId: chat.creatorId,
        recipientId: chat.recipientId,
        creatorName: chat.Creator?.Profile?.fullName,
        recipientName: chat.Recipient?.Profile?.fullName,
        lastMessage: chat.LastSentMessage?.content,
      })),
    })
    return directChats
  }

  // search direct chats with keyword
  @Get('search-direct-chats')
  async searchDirectChats(@Query() query: SearchDirectChatsDTO, @User() user: TUserWithProfile) {
    const directChats = await this.conversationService.searchDirectChatsByUser(
      user.id,
      query.search,
      query.lastId,
      query.limit
    )
    console.log('🔎 [searchDirectChats] Result:', {
      userId: user.id,
      query: { search: query.search, lastId: query.lastId, limit: query.limit },
      totalResults: directChats.length,
      results: directChats.map((chat) => ({
        id: chat.id,
        creatorId: chat.creatorId,
        recipientId: chat.recipientId,
        creatorName: chat.Creator?.Profile?.fullName,
        recipientName: chat.Recipient?.Profile?.fullName,
        lastMessage: chat.LastSentMessage?.content,
      })),
    })
    return directChats
  }

  @Post('create')
  async createDirectChat(@Body() body: CreateDirectChatDTO, @User('id') userId: number) {
    const result = await this.conversationService.createDirectChat(userId, body.recipientId)
    console.log('➕ [createDirectChat] Result:', {
      creatorId: userId,
      recipientId: body.recipientId,
      result: {
        id: result.id,
        creatorId: result.creatorId,
        recipientId: result.recipientId,
        creatorName: (result as any)?.Creator?.Profile?.fullName,
        recipientName: (result as any)?.Recipient?.Profile?.fullName,
      },
    })
    return result
  }
}

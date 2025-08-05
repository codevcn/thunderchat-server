import { Inject, Injectable } from '@nestjs/common'
import { PrismaService } from '../configs/db/prisma.service'
import { EProviderTokens, ESyncDataToESWorkerType } from '@/utils/enums'
import type { TMessage, TMessageWithRecipients } from '@/utils/entities/message.entity'
import { EMessageStatus, EMessageTypes, ESortTypes } from '@/direct-message/direct-message.enum'
import dayjs from 'dayjs'
import type {
  TGetDirectMessagesData,
  TGetDirectMessagesMessage,
  TMessageOffset,
  TMessageUpdates,
} from './direct-message.type'
import { SyncDataToESService } from '@/configs/elasticsearch/sync-data-to-ES/sync-data-to-ES.service'
import { canSendDirectMessage } from './can-send-message.helper'

@Injectable()
export class DirectMessageService {
  private readonly messageIncludeReplyToAndAuthor = {
    ReplyTo: {
      include: {
        Author: {
          include: {
            Profile: true,
          },
        },
      },
    },
    Author: {
      include: {
        Profile: true,
      },
    },
  }

  constructor(
    @Inject(EProviderTokens.PRISMA_CLIENT) private PrismaService: PrismaService,
    private syncDataToESService: SyncDataToESService
  ) {}

  async fidMsgById(msgId: number): Promise<TMessage | null> {
    return await this.PrismaService.message.findUnique({
      where: { id: msgId },
      include: {
        ReplyTo: true,
      },
    })
  }

  async createNewMessage(
    encryptedContent: string,
    authorId: number,
    timestamp: Date,
    directChatId: number,
    recipientId: number,
    type: EMessageTypes = EMessageTypes.TEXT,
    stickerId?: number,
    mediaId?: number,
    fileName?: string,
    thumbnailUrl?: string,
    replyToId?: number
  ): Promise<TGetDirectMessagesMessage> {
    // Kiểm tra quyền gửi tin nhắn 1-1
    await canSendDirectMessage(this.PrismaService, authorId, recipientId)
    const message = await this.PrismaService.message.create({
      data: {
        content: encryptedContent,
        authorId,
        createdAt: timestamp,
        directChatId,
        status: EMessageStatus.SENT,
        type,
        stickerId,
        recipientId,
        ...(mediaId && { mediaId }),
        ...(fileName && { fileName }),
        ...(thumbnailUrl && { thumbnailUrl }),
        ...(replyToId && { replyToId }),
      },
      include: this.messageIncludeReplyToAndAuthor,
    })
    this.syncDataToESService.syncDataToES({
      type: ESyncDataToESWorkerType.CREATE_MESSAGE,
      data: message,
      // msgEncryptor: this.syncDataToESService.getESMessageEncryptor(authorId),
    })
    return message
  }

  async updateMsg(msgId: number, updates: TMessageUpdates): Promise<TMessage> {
    const message = await this.PrismaService.message.update({
      where: { id: msgId },
      data: updates,
    })
    this.syncDataToESService.syncDataToES({
      type: ESyncDataToESWorkerType.UPDATE_MESSAGE,
      data: message,
    })
    return message
  }

  async getNewerDirectMessages(
    messageOffset: TMessageOffset,
    directChatId: number,
    limit: number
  ): Promise<TGetDirectMessagesMessage[]> {
    console.log(
      '[getNewerDirectMessages] Nhận yêu cầu với directChatId:',
      directChatId,
      'offset:',
      messageOffset,
      'limit:',
      limit
    )
    const messages = await this.PrismaService.message.findMany({
      where: {
        directChatId,
        id: {
          gt: messageOffset,
        },
      },
      orderBy: {
        id: 'asc',
      },
      take: limit,
      include: this.messageIncludeReplyToAndAuthor,
    })
    console.log(
      '[getNewerDirectMessages] Trả về',
      messages.length,
      'tin nhắn:',
      messages.map((m) => m.id)
    )
    return messages
  }

  private sortFetchedMessages(
    messages: TGetDirectMessagesMessage[],
    sortType: ESortTypes
  ): TGetDirectMessagesMessage[] {
    const msgs = [...messages]
    switch (sortType) {
      case ESortTypes.TIME_ASC:
        msgs.sort((curr, next) => dayjs(curr.createdAt).valueOf() - dayjs(next.createdAt).valueOf())
        return msgs
    }
    return msgs
  }

  async getOlderDirectMessages(
    messageOffset: TMessageOffset | undefined,
    directChatId: number,
    limit: number,
    equalOffset: boolean
  ): Promise<TGetDirectMessagesMessage[]> {
    return await this.PrismaService.message.findMany({
      where: {
        id: {
          [equalOffset ? 'lte' : 'lt']: messageOffset,
        },
        directChatId: directChatId,
      },
      orderBy: {
        id: 'desc',
      },
      take: limit,
      include: this.messageIncludeReplyToAndAuthor,
    })
  }

  async getOlderDirectMessagesHandler(
    messageOffset: TMessageOffset | undefined,
    directChatId: number,
    limit: number,
    isFirstTime: boolean = false,
    sortType: ESortTypes = ESortTypes.TIME_ASC
  ): Promise<TGetDirectMessagesData> {
    const messages = await this.getOlderDirectMessages(
      messageOffset,
      directChatId,
      limit + 1,
      isFirstTime
    )
    let sortedMessages: TGetDirectMessagesMessage[] | null = null
    if (messages && messages.length > 0) {
      if (messages.length > limit) {
        sortedMessages = messages.slice(0, -1)
      } else {
        sortedMessages = messages
      }
      if (sortType) {
        sortedMessages = this.sortFetchedMessages(sortedMessages, sortType)
      }
    }
    // Thêm log để kiểm tra các type message trả về
    // console.log(
    //   '[DEBUG][getOlderDirectMessagesHandler] Message types:',
    //   (sortedMessages || messages).map((m) => m.type)
    // )
    return {
      hasMoreMessages: messages.length > limit,
      directMessages: sortedMessages || [],
    }
  }

  async updateMessageStatus(msgId: number, status: EMessageStatus): Promise<TMessage> {
    return await this.updateMsg(msgId, {
      status,
    })
  }

  async findMessagesByIds(ids: number[], limit: number): Promise<TMessageWithRecipients[]> {
    return await this.PrismaService.message.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        Recipient: {
          include: {
            Profile: true,
          },
        },
        GroupChat: {
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
        },
      },
      take: limit,
    })
  }

  async getMediaMessages(
    directChatId: number,
    limit: number,
    offset: number,
    sortType: ESortTypes = ESortTypes.TIME_ASC
  ) {
    // Lấy tất cả message KHÔNG PHẢI TEXT
    return this.PrismaService.message.findMany({
      where: {
        directChatId,
        type: {
          not: EMessageTypes.TEXT,
        },
      },
      orderBy: {
        createdAt: sortType === ESortTypes.TIME_ASC ? 'asc' : 'desc',
      },
      take: limit,
      skip: offset,
    })
  }

  async getVoiceMessages(
    directChatId: number,
    limit: number,
    offset: number,
    sortType: ESortTypes = ESortTypes.TIME_ASC
  ) {
    // Lấy chỉ voice messages
    const voiceMessages = await this.PrismaService.message.findMany({
      where: {
        directChatId,
        type: EMessageTypes.MEDIA,
        mediaId: {
          not: null,
        },
      },
      orderBy: {
        createdAt: sortType === ESortTypes.TIME_ASC ? 'asc' : 'desc',
      },
      take: limit,
      skip: offset,
    })

    return {
      hasMoreMessages: voiceMessages.length === limit,
      directMessages: voiceMessages,
    }
  }

  async getMessageContext(messageId: number) {
    console.log('[getMessageContext] Nhận yêu cầu lấy context cho messageId:', messageId)
    // 1. Lấy tin nhắn trung tâm (tin nhắn muốn dẫn tới)
    const centerMsg = await this.PrismaService.message.findUnique({
      where: { id: messageId },
      include: this.messageIncludeReplyToAndAuthor,
    })
    if (!centerMsg) {
      console.error('[getMessageContext] Không tìm thấy messageId:', messageId)
      throw new Error('Message not found')
    }
    console.log(
      '[getMessageContext] Tìm thấy messageId:',
      messageId,
      'directChatId:',
      centerMsg.directChatId
    )

    // 2. Lấy 10 tin nhắn trước
    const prevMsgs = await this.PrismaService.message.findMany({
      where: {
        directChatId: centerMsg.directChatId,
        createdAt: { lt: centerMsg.createdAt },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: this.messageIncludeReplyToAndAuthor,
    })
    // 3. Lấy 10 tin nhắn sau
    const nextMsgs = await this.PrismaService.message.findMany({
      where: {
        directChatId: centerMsg.directChatId,
        createdAt: { gt: centerMsg.createdAt },
      },
      orderBy: { createdAt: 'asc' },
      take: 10,
      include: this.messageIncludeReplyToAndAuthor,
    })
    console.log(
      '[getMessageContext] prevMsgs:',
      prevMsgs.map((m) => m.id),
      'center:',
      centerMsg.id,
      'nextMsgs:',
      nextMsgs.map((m) => m.id)
    )
    // 4. Ghép lại đúng thứ tự thời gian
    const messages: (TGetDirectMessagesMessage & { isLastMsgInList?: boolean })[] = [
      ...prevMsgs.reverse(),
      centerMsg,
      ...nextMsgs,
    ]
    // 5. Đánh dấu isLastMsgInList cho tin cuối cùng
    if (messages.length > 0) {
      messages[messages.length - 1].isLastMsgInList = true
    }
    console.log(
      '[getMessageContext] Trả về',
      messages.length,
      'tin nhắn cho messageId:',
      messageId,
      'Các id:',
      messages.map((m) => m.id)
    )
    return messages
  }
}

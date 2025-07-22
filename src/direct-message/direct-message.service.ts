import { Inject, Injectable } from '@nestjs/common'
import { PrismaService } from '../configs/db/prisma.service'
import { EProviderTokens, ESyncDataToESWorkerType } from '@/utils/enums'
import type { TDirectMessage } from '@/utils/entities/direct-message.entity'
import { EMessageStatus, EMessageTypes, ESortTypes } from '@/utils/types'
import dayjs from 'dayjs'
import type {
  TGetDirectMessagesData,
  TGetDirectMessagesMessage,
  TMessageOffset,
  TMessageUpdates,
} from './direct-message.type'
import { SyncDataToESService } from '@/configs/elasticsearch/sync-data-to-ES/sync-data-to-ES.service'

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

  async fidMsgById(msgId: number): Promise<TDirectMessage | null> {
    return await this.PrismaService.directMessage.findUnique({
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
    stickerUrl?: string,
    mediaUrl?: string,
    fileName?: string,
    replyToId?: number
  ): Promise<TGetDirectMessagesMessage> {
    const message = await this.PrismaService.directMessage.create({
      data: {
        content: encryptedContent,
        authorId,
        createdAt: timestamp,
        directChatId,
        status: EMessageStatus.SENT,
        type,
        stickerUrl,
        recipientId,
        ...(mediaUrl && { mediaUrl: mediaUrl as any }),
        ...(fileName && { fileName }),
        ...(replyToId && { replyToId }),
      },
      include: this.messageIncludeReplyToAndAuthor,
    })
    // this.syncDataToESService.syncDataToES(authorId, {
    //    type: ESyncDataToESWorkerType.CREATE_MESSAGE,
    //    data: message,
    //    msgEncryptor: this.syncDataToESService.getESMessageEncryptor(authorId),
    // })
    return message
  }

  async updateMsg(msgId: number, updates: TMessageUpdates): Promise<TDirectMessage> {
    const message = await this.PrismaService.directMessage.update({
      where: { id: msgId },
      data: updates,
    })
    this.syncDataToESService.syncDataToES(message.authorId, {
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
    const messages = await this.PrismaService.directMessage.findMany({
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
    messageOffset: TMessageOffset,
    directChatId: number,
    limit: number,
    equalOffset: boolean
  ): Promise<TGetDirectMessagesMessage[]> {
    return await this.PrismaService.directMessage.findMany({
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
    messageOffset: TMessageOffset,
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
      sortedMessages = messages.slice(0, -1)
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

  async updateMessageStatus(msgId: number, status: EMessageStatus): Promise<TDirectMessage> {
    return await this.updateMsg(msgId, {
      status,
    })
  }

  async getMessageContext(messageId: number) {
    console.log('[getMessageContext] Nhận yêu cầu lấy context cho messageId:', messageId)
    // 1. Lấy tin nhắn trung tâm (tin nhắn muốn dẫn tới)
    const centerMsg = await this.PrismaService.directMessage.findUnique({
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
    const prevMsgs = await this.PrismaService.directMessage.findMany({
      where: {
        directChatId: centerMsg.directChatId,
        createdAt: { lt: centerMsg.createdAt },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: this.messageIncludeReplyToAndAuthor,
    })
    // 3. Lấy 10 tin nhắn sau
    const nextMsgs = await this.PrismaService.directMessage.findMany({
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

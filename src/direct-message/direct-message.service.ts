import { Inject, Injectable } from '@nestjs/common'
import { PrismaService } from '../configs/db/prisma.service'
import { EProviderTokens, ESyncDataToESWorkerType } from '@/utils/enums'
import type {
  TDirectMessage,
  TDirectMessageWithRecipient,
} from '@/utils/entities/direct-message.entity'
import { EMessageStatus, EMessageTypes, ESortTypes } from '@/utils/enums'
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
    directChatId: number
  ): Promise<TGetDirectMessagesMessage[]> {
    return await this.PrismaService.directMessage.findMany({
      where: {
        directChatId,
        id: {
          gt: messageOffset,
        },
      },
      orderBy: {
        id: 'asc',
      },
      include: this.messageIncludeReplyToAndAuthor,
    })
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
      sortedMessages = messages.slice(0, -1)
      if (sortType) {
        sortedMessages = this.sortFetchedMessages(sortedMessages, sortType)
      }
    }
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

  async findMessagesByIds(ids: number[], limit: number): Promise<TDirectMessageWithRecipient[]> {
    return await this.PrismaService.directMessage.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        Recipient: {
          include: {
            Profile: true,
          },
        },
      },
      take: limit,
    })
  }
}

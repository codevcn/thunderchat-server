import { PrismaService } from '@/configs/db/prisma.service'
import { SyncDataToESService } from '@/configs/elasticsearch/sync-data-to-ES/sync-data-to-ES.service'
import { EProviderTokens } from '@/utils/enums'
import { Inject, Injectable } from '@nestjs/common'
import type { TGetGroupMessagesData, TMessageOffset } from './group-message.type'
import type {
  TGroupMessage,
  TGroupMessageWithGroupChat,
} from '@/utils/entities/group-message.entity'
import { ESortTypes } from '@/utils/enums'
import dayjs from 'dayjs'

@Injectable()
export class GroupMessageService {
  constructor(
    @Inject(EProviderTokens.PRISMA_CLIENT) private PrismaService: PrismaService,
    private syncDataToESService: SyncDataToESService
  ) {}

  async getNewerGroupMessages(
    messageOffset: TMessageOffset,
    groupChatId: number
  ): Promise<TGroupMessage[]> {
    return await this.PrismaService.groupMessage.findMany({
      where: {
        groupChatId,
        id: {
          gt: messageOffset,
        },
      },
      orderBy: {
        id: 'asc',
      },
    })
  }

  private sortFetchedMessages(messages: TGroupMessage[], sortType: ESortTypes): TGroupMessage[] {
    const msgs = [...messages]
    switch (sortType) {
      case ESortTypes.TIME_ASC:
        msgs.sort((curr, next) => dayjs(curr.createdAt).valueOf() - dayjs(next.createdAt).valueOf())
        return msgs
    }
    return msgs
  }

  async getOlderGroupMessages(
    messageOffset: TMessageOffset,
    groupChatId: number,
    limit: number,
    equalOffset: boolean
  ): Promise<TGroupMessage[]> {
    return await this.PrismaService.groupMessage.findMany({
      where: {
        id: {
          [equalOffset ? 'lte' : 'lt']: messageOffset,
        },
        groupChatId: groupChatId,
      },
      orderBy: {
        id: 'desc',
      },
      take: limit,
    })
  }

  async getOlderGroupMessagesHandler(
    messageOffset: TMessageOffset,
    groupChatId: number,
    limit: number,
    isFirstTime: boolean = false,
    sortType: ESortTypes = ESortTypes.TIME_ASC
  ): Promise<TGetGroupMessagesData> {
    const messages = await this.getOlderGroupMessages(
      messageOffset,
      groupChatId,
      limit + 1,
      isFirstTime
    )
    let sortedMessages: TGroupMessage[] | null = null
    if (messages && messages.length > 0) {
      sortedMessages = messages.slice(0, -1)
      if (sortType) {
        sortedMessages = this.sortFetchedMessages(sortedMessages, sortType)
      }
    }
    return {
      hasMoreMessages: messages.length > limit,
      groupMessages: sortedMessages || [],
    }
  }

  async findMessagesByIds(ids: number[], limit: number): Promise<TGroupMessageWithGroupChat[]> {
    return await this.PrismaService.groupMessage.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        GroupChat: true,
      },
      take: limit,
    })
  }
}

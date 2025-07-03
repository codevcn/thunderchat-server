import { Inject, Injectable } from '@nestjs/common'
import { PrismaService } from '../configs/db/prisma.service'
import { EProviderTokens, ESyncDataToESWorkerType } from '@/utils/enums'
import type { TDirectMessage } from '@/utils/entities/direct-message.entity'
import { EMessageStatus, EMessageTypes, ESortTypes } from './direct-message.enum'
import dayjs from 'dayjs'
import type { TGetDirectMessagesData, TMessageOffset, TMessageUpdates } from './direct-message.type'
import { SyncDataToESService } from '@/configs/elasticsearch/sync-data-to-ES/sync-data-to-ES.service'

@Injectable()
export class DirectMessageService {
   constructor(
      @Inject(EProviderTokens.PRISMA_CLIENT) private PrismaService: PrismaService,
      private syncDataToESService: SyncDataToESService
   ) {}

   async findMsgById(msgId: number): Promise<TDirectMessage | null> {
      return await this.PrismaService.directMessage.findUnique({
         where: { id: msgId },
      })
   }

   async createNewMessage(
      encryptedContent: string,
      authorId: number,
      timestamp: Date,
      directChatId: number,
      recipientId: number,
      type: EMessageTypes = EMessageTypes.TEXT,
      stickerUrl?: string
   ): Promise<TDirectMessage> {
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
         },
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
   ): Promise<TDirectMessage[]> {
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
      })
   }

   private sortFetchedMessages(messages: TDirectMessage[], sortType: ESortTypes): TDirectMessage[] {
      const msgs = [...messages]
      switch (sortType) {
         case ESortTypes.TIME_ASC:
            msgs.sort(
               (curr, next) => dayjs(curr.createdAt).valueOf() - dayjs(next.createdAt).valueOf()
            )
            return msgs
      }
      return msgs
   }

   async getOlderDirectMessages(
      messageOffset: TMessageOffset,
      directChatId: number,
      limit: number,
      equalOffset: boolean
   ): Promise<TDirectMessage[]> {
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
      let sortedMessages: TDirectMessage[] | null = null
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
}

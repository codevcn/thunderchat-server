import type {
   TFetchDirectChatsData,
   TFindDirectChatData,
   TUpdateDirectChatData,
} from './direct-chat.type'
import { Inject, Injectable } from '@nestjs/common'
import { PrismaService } from '@/configs/db/prisma.service'
import { EProviderTokens } from '@/utils/enums'
import { Prisma } from '@prisma/client'

@Injectable()
export class DirectChatService {
   constructor(@Inject(EProviderTokens.PRISMA_CLIENT) private PrismaService: PrismaService) {}

   async findById(id: number, userId: number): Promise<TFindDirectChatData | null> {
      return await this.PrismaService.directChat.findUnique({
         where: { id, OR: [{ creatorId: userId }, { recipientId: userId }] },
         include: {
            Recipient: {
               include: {
                  Profile: true,
               },
            },
            Creator: {
               include: {
                  Profile: true,
               },
            },
         },
      })
   }

   async updateDirectChat(directChatId: number, updates: TUpdateDirectChatData): Promise<void> {
      await this.PrismaService.directChat.update({
         where: { id: directChatId },
         data: updates,
      })
   }

   async addLastSentMessage(directChatId: number, lastSentMessageId: number): Promise<void> {
      await this.updateDirectChat(directChatId, { lastSentMessageId })
   }

   async findDirectChatsByUser(
      userId: number,
      lastId?: number,
      limit: number = 20
   ): Promise<TFetchDirectChatsData[]> {
      // Lấy các direct chat mà user là creator hoặc recipient
      const findCondition: Prisma.DirectChatWhereInput = {
         OR: [{ creatorId: userId }, { recipientId: userId }],
      }
      if (lastId) {
         // Giả sử muốn lấy các direct chat có id < lastId (phân trang lùi)
         findCondition.id = { lt: lastId }
      }
      return await this.PrismaService.directChat.findMany({
         where: findCondition,
         orderBy: { id: 'desc' },
         take: limit,
         include: {
            LastSentMessage: true,
            Recipient: {
               include: { Profile: true },
            },
            Creator: {
               include: { Profile: true },
            },
         },
      })
   }
}

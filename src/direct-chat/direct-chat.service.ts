import type { TFindDirectChatData, TUpdateDirectChatData } from './direct-chat.type'
import { Inject, Injectable } from '@nestjs/common'
import { PrismaService } from '@/configs/db/prisma.service'
import { EProviderTokens } from '@/utils/enums'

@Injectable()
export class DirectChatService {
   constructor(@Inject(EProviderTokens.PRISMA_CLIENT) private PrismaService: PrismaService) {}

   async findById(id: number): Promise<TFindDirectChatData | null> {
      return await this.PrismaService.directChat.findUnique({
         where: { id },
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
}

import { EProviderTokens } from '@/utils/enums'
import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common'
import { PrismaService } from '@/configs/db/prisma.service'
import { DirectMessageService } from '@/direct-message/direct-message.service'
import { ElasticsearchService } from '@/configs/elasticsearch/elasticsearch.service'
import { parseTxtFileToObject } from './helpers'
import { EMessageTypes } from '@/direct-message/direct-message.enum'

@Controller('temp')
export class TempController {
   constructor(
      @Inject(EProviderTokens.PRISMA_CLIENT) private PrismaService: PrismaService,
      private DirectMessageService: DirectMessageService,
      private elasticsearchService: ElasticsearchService
   ) {}

   @Get('dl-all-msg')
   async deleteAllMessages() {
      await this.PrismaService.directMessage.deleteMany()
   }

   @Post('all-msg')
   async getAllMessages(@Body() payload: any) {
      const { msgOffset, directChatId, limit, sortType } = payload
      const res = await this.DirectMessageService.getOlderDirectMessagesHandler(
         msgOffset,
         directChatId,
         limit,
         false,
         sortType
      )
      console.log('>>> res:', res)
   }

   @Get('init-data')
   async initData(@Query() query: any) {
      // sync users to elasticsearch
      const obj = await parseTxtFileToObject('./temp.txt')
      const { key: objKey } = obj
      const { key: queryKey } = query
      if (!objKey || !queryKey || queryKey !== objKey) {
         console.log('>>> objKey or queryKey is required')
         return { success: false, error: 'objKey or queryKey is required' }
      }
      const users = await this.PrismaService.user.findMany({ include: { Profile: true } })
      for (const user of users) {
         console.log('>>> user:', user)
         await this.elasticsearchService.createUser(user.id, {
            user_id: user.id,
            full_name: user.Profile?.fullName,
            avatar: user.Profile?.avatar || undefined,
            email: user.email,
         })
         console.log('>>> run this create new doc successfully')
      }
      return { success: true }
   }

   @Get('todo')
   async todo(@Query() query: any) {
      const { keyword, limit } = query
      if (!keyword || !limit) {
         console.log('>>> keyword or limit is required')
         return { success: false, error: 'keyword or limit is required' }
      }
      await this.elasticsearchService.searchUsers(keyword, limit)
      return { success: true }
   }

   @Get('test')
   async test(@Query() query: any) {
      try {
         console.log('>>> run this test api create new message')
         const { content, authorId, recipientId, directChatId, type, stickerUrl } = query
         if (!content || !authorId || !recipientId || !directChatId) {
            console.log('>>> input data is required')
            return { success: false, error: 'input data is required' }
         }
         const res = await this.DirectMessageService.createNewMessage(
            content,
            Number(authorId),
            new Date(),
            Number(directChatId),
            Number(recipientId),
            type,
            stickerUrl
         )
         console.log('>>> res:', res)
         return { success: true }
      } catch (error) {
         console.log('>>> error:', error)
         return { success: false, error: error.message }
      }
   }
}

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { Prisma, PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService
   extends PrismaClient<Prisma.PrismaClientOptions, 'query'>
   implements OnModuleInit, OnModuleDestroy
{
   constructor() {
      super({ log: [{ emit: 'event', level: 'query' }] })
      this.$on('query', async (e) => {
         queueMicrotask(() => {
            console.log('\n>>> SQL Query:')
            console.log(e.query)
            console.log('>>> Params:', e.params)
            console.log('>>> Duration:', `${e.duration}ms`, '\n')
         })
      })
   }

   async onModuleInit() {
      try {
         await this.$connect()
         console.log('>>> Connect DB successfully')
      } catch (error) {
         console.log('>>> DB connection error >>>', error)
      }
   }

   async onModuleDestroy() {
      try {
         await this.$disconnect()
         console.log('>>> Disconnect DB successfully')
      } catch (error) {
         console.log('>>> DB disconnection error >>>', error)
      }
   }
}

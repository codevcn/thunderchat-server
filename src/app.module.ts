import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { ConfigModule } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { DirectChatsModule } from './direct-chat/direct-chat.module'
import { DirectMessageModule } from './direct-message/direct-message.module'
import { PrismaModule } from './configs/db/prisma.module'
import { envValidation } from './utils/validation/env.validation'
import { UserModule } from './user/user.module'
import ms from 'ms'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { LoggerModule } from './configs/logger/logger.module'

const globalConfigModules = [
   ConfigModule.forRoot({
      envFilePath: ['.env.development', '.env'],
      validate: envValidation,
   }),
   LoggerModule,
   PrismaModule,
   JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: {
         expiresIn: ms(process.env.JWT_TOKEN_MAX_AGE_IN_HOUR),
      },
   }),
   EventEmitterModule.forRoot({ verboseMemoryLeak: true, delimiter: ':' }),
]

// put gateway here to be able to get env right way
import { FriendModule } from './friend/friend.module'
import { GatewayModule } from './gateway/gateway.module'
import { RequestLoggerMiddleware } from './app.middleware'
import { TempModule } from './temp/temp.module'
import { StickersModule } from './direct-message/stickers/stickers.module'
import { FriendRequestModule } from './friend-request/friend-request.module'
import { SearchModule } from './search/search.module'

@Module({
   imports: [
      ...globalConfigModules,
      AuthModule,
      GatewayModule,
      DirectChatsModule,
      DirectMessageModule,
      UserModule,
      FriendRequestModule,
      FriendModule,
      StickersModule,
      SearchModule,
      TempModule,
   ],
})
export class AppModule implements NestModule {
   configure(consumer: MiddlewareConsumer) {
      consumer.apply(RequestLoggerMiddleware).forRoutes('*')
   }
}

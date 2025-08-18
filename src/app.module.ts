import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { ConfigModule } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { DirectChatsModule } from './direct-chat/direct-chat.module'
import { DirectMessageModule } from './direct-message/direct-message.module'
import { MediaMessageModule } from './direct-message/media-message/media-message.module'
import { PrismaModule } from './configs/db/prisma.module'
import { envValidation } from './utils/validation/env.validation'
import { UserModule } from './user/user.module'
import { UserReportModule } from './user-report/user-report.module'
import ms from 'ms'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { LoggerModule } from './configs/logger/logger.module'
import { ProfileModule } from './profile/profile.module'
import { PinModule } from './direct-message/pin/pin.module'
import { PinDirectChatModule } from './direct-chat/pin-direct-chat/pin-direct-chat.module'
import { UserSettingsModule } from './user-settings/user-settings.module'

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
import { DevModule } from './dev/dev.module'
import { StickersModule } from './direct-message/stickers/stickers.module'
import { FriendRequestModule } from './friend-request/friend-request.module'
import { SearchModule } from './search/search.module'
import { GroupChatModule } from './group-chat/group-chat.module'
import { UploadModule } from './upload/upload.module'

import { GroupMemberModule } from './group-member/group-member.module'
import { DeleteMessageModule } from './direct-message/delete-message/delete-message.module'
import { AdminModule } from './admin/admin.module'
import { PinConversationModule } from './pin-conversation/pin-conversation.module'
import { HealthcheckModule } from './healthcheck/healthcheck.module'
import { PushNotificationModule } from './push-notification/push-notification.module'

@Module({
  imports: [
    ...globalConfigModules,
    AuthModule,
    GatewayModule,
    DirectChatsModule,
    DirectMessageModule,
    MediaMessageModule,
    UserModule,
    UserReportModule,
    FriendRequestModule,
    FriendModule,
    StickersModule,
    SearchModule,
    GroupChatModule,
    UploadModule,
    PinConversationModule,
    GroupMemberModule,
    DevModule,
    ProfileModule,
    PinModule,
    PinDirectChatModule,
    UserSettingsModule,
    DeleteMessageModule,
    PushNotificationModule,
    AdminModule,
    HealthcheckModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*')
  }
}

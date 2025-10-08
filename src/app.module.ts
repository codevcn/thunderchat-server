import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { ConfigModule } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { DirectChatsModule } from './direct-chat/direct-chat.module'
import { MessageModule } from './message/message.module'
import { MediaMessageModule } from './message/media-message/media-message.module'
import { PrismaModule } from './configs/db/prisma.module'
import { envValidation } from './utils/validation/env.validation'
import { UserModule } from './user/user.module'
import { UserReportModule } from './user/user-report/user-report.module'
import ms from 'ms'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { LoggerModule } from './configs/logger/logger.module'
import { ProfileModule } from './profile/profile.module'
import { PinModule } from './message/pin/pin.module'
import { UserSettingsModule } from './user/user-settings/user-settings.module'

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
import { MessagingGatewayModule } from './messaging/messaging.module'
import { RequestLoggerMiddleware } from './app.middleware'
import { DevModule } from './dev/dev.module'
import { StickersModule } from './message/stickers/stickers.module'
import { FriendRequestModule } from './friend-request/friend-request.module'
import { SearchModule } from './search/search.module'
import { GroupChatModule } from './group-chat/group-chat.module'
import { GroupMemberModule } from './group-member/group-member.module'
import { DeleteMessageModule } from './message/delete-message/delete-message.module'
import { AdminModule } from './admin/admin.module'
import { PinConversationModule } from './pin-conversation/pin-conversation.module'
import { HealthcheckModule } from './healthcheck/healthcheck.module'
import { PushNotificationModule } from './configs/push-notification/push-notification.module'
import { VoiceCallGatewayModule } from './voice-call/voice-call.module'
import { join } from 'path'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { DevLogger } from './dev/dev-logger'
import type { IAPIGatewayRouting } from './app.interface'
import { loadJSONFileSync } from './utils/helpers'
import { GrpcClientModule } from './configs/communication/grpc/grpc-client.module'
import { AuthMiddleware } from './auth/auth.middleware'

@Module({
  imports: [
    ...globalConfigModules,
    GrpcClientModule,
    AuthModule,
    MessagingGatewayModule,
    VoiceCallGatewayModule,
    DirectChatsModule,
    MessageModule,
    MediaMessageModule,
    UserModule,
    UserReportModule,
    FriendRequestModule,
    FriendModule,
    StickersModule,
    SearchModule,
    GroupChatModule,
    PinConversationModule,
    GroupMemberModule,
    DevModule,
    ProfileModule,
    PinModule,
    UserSettingsModule,
    DeleteMessageModule,
    PushNotificationModule,
    AdminModule,
    HealthcheckModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    this.initLoggingMiddleware(consumer)
    this.authRoutes(consumer)
    this.initRoutingProxyMiddleware(consumer)
  }

  initLoggingMiddleware(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*')
  }

  initRoutingProxyMiddleware(consumer: MiddlewareConsumer) {
    const config = loadJSONFileSync<IAPIGatewayRouting>(
      join(__dirname, '/../routing/', 'api-gateway-routing.json')
    )
    if (!config) return

    for (const { path, target, rewrite, changeOrigin } of config.routes) {
      consumer
        .apply(
          createProxyMiddleware({
            target,
            changeOrigin,
            pathRewrite: rewrite,
            on: {
              proxyReq: (proxyReq, req, res) => {
                DevLogger.logInfo('Proxying request to:', target + req.url)
              },
              proxyRes: (proxyRes, req, res) => {
                DevLogger.logInfo('Received response from target')
              },
            },
          })
        )
        .forRoutes({ path, method: RequestMethod.ALL })
    }
  }

  authRoutes(consumer: MiddlewareConsumer) {
    const config = loadJSONFileSync<IAPIGatewayRouting>(
      join(__dirname, 'auth', 'guarded-routes.json')
    )
    if (!config) return

    for (const { path } of config.routes) {
      consumer.apply(AuthMiddleware).forRoutes({ path, method: RequestMethod.ALL })
    }
  }
}

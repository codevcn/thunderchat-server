import { Module } from '@nestjs/common'
import { VoiceCallGateway } from './voice-call.gateway'
import { VoiceCallService } from './voice-call.service'
import { UserConnectionService } from '@/connection/user-connection.service'
import { AuthService } from '@/auth/auth.service'
import { UserConnectionModule } from '@/connection/user-connection.module'
import { UserModule } from '@/user/user.module'
import { VoiceCallConnectionService } from '@/connection/voice-call-connection.service'

@Module({
  imports: [UserConnectionModule, UserModule],
  providers: [
    VoiceCallGateway,
    VoiceCallService,
    UserConnectionService,
    AuthService,
    VoiceCallConnectionService,
  ],
})
export class VoiceCallGatewayModule {}

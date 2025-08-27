import { Module } from '@nestjs/common'
import { VoiceCallGateway } from './voice-call.gateway'
import { VoiceCallService } from './voice-call.service'
import { UserConnectionService } from '@/connection/user-connection.service'
import { AuthService } from '@/auth/auth.service'
import { UserConnectionModule } from '@/connection/user-connection.module'

@Module({
  imports: [UserConnectionModule],
  providers: [VoiceCallGateway, VoiceCallService, UserConnectionService, AuthService],
})
export class VoiceCallGatewayModule {}

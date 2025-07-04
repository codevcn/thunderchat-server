import { DirectChatController } from '@/direct-chat/direct-chat.controller'
import { DirectChatService } from './direct-chat.service'
import { Module } from '@nestjs/common'
import { JWTService } from '@/auth/jwt/jwt.service'
import { CredentialService } from '@/auth/credentials/credentials.service'
import { UserModule } from '@/user/user.module'

@Module({
   imports: [UserModule],
   controllers: [DirectChatController],
   providers: [DirectChatService, JWTService, CredentialService],
})
export class DirectChatsModule {}

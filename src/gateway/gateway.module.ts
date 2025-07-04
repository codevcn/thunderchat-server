import { Module } from '@nestjs/common'
import { AppGateway } from './gateway'
import { FriendService } from '@/friend/friend.service'
import { UserModule } from '@/user/user.module'
import { SocketModule } from './socket/socket.module'
import { DirectMessageModule } from '@/direct-message/direct-message.module'
import { DirectChatService } from '@/direct-chat/direct-chat.service'
import { SyncDataToESModule } from '@/configs/elasticsearch/sync-data-to-ES/sync-data-to-ES.module'

@Module({
   imports: [UserModule, SocketModule, DirectMessageModule, SyncDataToESModule],
   providers: [AppGateway, FriendService, DirectChatService],
})
export class GatewayModule {}

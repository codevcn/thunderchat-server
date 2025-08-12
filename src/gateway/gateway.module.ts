import { Module } from '@nestjs/common'
import { AppGateway } from './gateway'
import { FriendService } from '@/friend/friend.service'
import { UserModule } from '@/user/user.module'
import { SocketModule } from './socket/socket.module'
import { DirectMessageModule } from '@/direct-message/direct-message.module'
import { SyncDataToESModule } from '@/configs/elasticsearch/sync-data-to-ES/sync-data-to-ES.module'
import { GroupChatModule } from '@/group-chat/group-chat.module'
import { DirectChatsModule } from '@/direct-chat/direct-chat.module'
import { UserSettingsModule } from '@/user-settings/user-settings.module'
import { FriendModule } from '@/friend/friend.module'
import { UserConnectionService } from '@/connection/user-connection.service'

@Module({
  imports: [
    UserModule,
    SocketModule,
    DirectMessageModule,
    SyncDataToESModule,
    GroupChatModule,
    DirectChatsModule,
    UserSettingsModule,
    FriendModule,
  ],
  providers: [AppGateway, FriendService, UserConnectionService],
})
export class GatewayModule {}

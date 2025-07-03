import {
   ConnectedSocket,
   MessageBody,
   SubscribeMessage,
   WebSocketGateway,
} from '@nestjs/websockets'
import type { OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect } from '@nestjs/websockets'
import { Server } from 'socket.io'
import { EClientSocketEvents, EInitEvents } from './gateway.event'
import { ESocketNamespaces } from './gateway.enum'
import { HttpStatus, UseFilters, UsePipes, UseInterceptors } from '@nestjs/common'
import { FriendService } from '@/friend/friend.service'
import { BaseWsException } from '../utils/exceptions/base-ws.exception'
import { EFriendMessages } from '@/friend/friend.message'
import {
   CatchInternalSocketError,
   BaseWsExceptionsFilter,
} from '@/utils/exception-filters/base-ws-exception.filter'
import { DirectMessageService } from '@/direct-message/direct-message.service'
import type { TClientSocket } from './gateway.type'
import type { IEmitSocketEvents, IGateway } from './gateway.interface'
import { wsValidationPipe } from './gateway.validation'
import { SocketService } from './socket/socket.service'
import { MarkAsSeenDTO, TypingDTO, SendDirectMessageDTO } from './gateway.dto'
import type { TMessageOffset } from '@/direct-message/direct-message.type'
import { EMsgMessages } from '@/direct-message/direct-message.message'
import { AuthService } from '@/auth/auth.service'
import { MessageTokensManager } from '@/gateway/helpers/message-tokens.helper'
import { EMessageStatus, EMessageTypes } from '@/direct-message/direct-message.enum'
import { DirectChatService } from '@/direct-chat/direct-chat.service'
import type { TDirectMessage } from '@/utils/entities/direct-message.entity'
import { ConversationTypingManager } from './helpers/conversation-typing.helper'
import { SyncDataToESService } from '@/configs/elasticsearch/sync-data-to-ES/sync-data-to-ES.service'
import { GatewayInterceptor } from './gateway.interceptor'

@WebSocketGateway({
   cors: {
      origin:
         process.env.NODE_ENV === 'production'
            ? process.env.CLIENT_HOST
            : process.env.CLIENT_HOST_DEV,
      credentials: true,
   },
   namespace: ESocketNamespaces.app,
})
@UseFilters(new BaseWsExceptionsFilter())
@UsePipes(wsValidationPipe)
// @UseInterceptors(GatewayInterceptor)
export class AppGateway
   implements
      OnGatewayConnection<TClientSocket>,
      OnGatewayDisconnect<TClientSocket>,
      OnGatewayInit<Server>,
      IGateway
{
   private readonly messageTokensManager = new MessageTokensManager()
   private readonly convTypingManager = new ConversationTypingManager()

   constructor(
      private socketService: SocketService,
      private friendService: FriendService,
      private DirectMessageService: DirectMessageService,
      private authService: AuthService,
      private directChatService: DirectChatService,
      private syncDataToESService: SyncDataToESService
   ) {}

   /**
    * This function is called (called one time) when the server is initialized.
    * It sets the server and the server middleware.
    * The server middleware is used to validate the socket connection.
    * @param server - The server instance.
    */
   async afterInit(server: Server): Promise<void> {
      this.socketService.setServer(server)
      this.socketService.setServerMiddleware(async (socket, next) => {
         console.log('>>> socket 123:', socket.id)
         try {
            await this.authService.validateSocketConnection(socket)
         } catch (error) {
            next(error)
            return
         }
         next()
      })
   }

   /**
    * This function is called when a client connects to the server.
    * It validates the socket connection and adds the client to the connected clients list.
    * @param client - The client instance.
    */
   async handleConnection(client: TClientSocket): Promise<void> {
      queueMicrotask(() => {
         console.log('>>> connected socket:', {
            socketId: client.id,
            auth: client.handshake.auth,
         })
      })
      try {
         const { clientId, messageOffset, directChatId, groupId } =
            await this.authService.validateSocketAuth(client)
         // await this.syncDataToESService.initESMessageEncryptor(clientId)
         this.socketService.addConnectedClient(clientId, client)
         client.emit(EInitEvents.client_connected, 'Connected Sucessfully!')
         if (messageOffset) {
            await this.recoverMissingMessages(client, messageOffset, directChatId, groupId)
         }
      } catch (error) {
         console.log('>>> error:', error)
         client.disconnect(true)
      }
   }

   /**
    * This function is called when a client disconnects from the server.
    * It removes the client from the connected clients list and the message tokens.
    * @param client - The client instance.
    */
   async handleDisconnect(client: TClientSocket): Promise<void> {
      queueMicrotask(() => {
         console.log('>>> disconnected socket:', {
            socketId: client.id,
            auth: client.handshake.auth,
         })
      })
      const { userId } = client.handshake.auth
      if (userId) {
         this.socketService.removeConnectedClient(userId)
         this.messageTokensManager.removeAllTokens(userId)
      }
   }

   async recoverMissingMessages(
      clientSocket: TClientSocket,
      messageOffset: TMessageOffset,
      directChatId?: number,
      groupChatId?: number
   ): Promise<void> {
      if (directChatId) {
         const messages = await this.DirectMessageService.getNewerDirectMessages(
            messageOffset,
            directChatId
         )
         if (messages && messages.length > 0) {
            clientSocket.emit(
               EClientSocketEvents.recovered_connection,
               messages as TDirectMessage[]
            )
         }
      }
   }

   async checkUniqueMessage(token: string, clientId: number): Promise<void> {
      if (!this.messageTokensManager.isUniqueToken(clientId, token)) {
         throw new BaseWsException(EMsgMessages.MESSAGE_OVERLAPS)
      }
   }

   async checkFriendship(clientId: number, receiverId: number): Promise<void> {
      const isFriend = await this.friendService.isFriend(clientId, receiverId)
      if (!isFriend) {
         throw new BaseWsException(EFriendMessages.IS_NOT_FRIEND, HttpStatus.BAD_REQUEST)
      }
   }

   async handleMessage(
      client: { socket: TClientSocket; id: number },
      message: {
         content: string
         timestamp: Date
         directChatId: number
         receiverId: number
         type: EMessageTypes
         stickerUrl?: string
      }
   ): Promise<void> {
      const { id, socket } = client
      const { content, timestamp, directChatId, receiverId, stickerUrl, type } = message
      const newMessage = await this.DirectMessageService.createNewMessage(
         content,
         id,
         timestamp,
         directChatId,
         receiverId,
         type,
         stickerUrl
      )
      await this.directChatService.addLastSentMessage(directChatId, newMessage.id)
      const recipientSocket = this.socketService.getConnectedClient<IEmitSocketEvents>(receiverId)
      if (recipientSocket) {
         recipientSocket.emit(EClientSocketEvents.send_message_direct, newMessage)
      }
      socket.emit(EClientSocketEvents.send_message_direct, newMessage)
   }

   @SubscribeMessage(EClientSocketEvents.send_message_direct)
   @CatchInternalSocketError()
   async handleSendDirectMessage(
      @MessageBody() payload: SendDirectMessageDTO,
      @ConnectedSocket() client: TClientSocket
   ) {
      console.log('>>> payload 123:', payload)
      const { clientId } = await this.authService.validateSocketAuth(client)
      const { type, msgPayload } = payload
      const { receiverId, token } = msgPayload

      await this.checkUniqueMessage(token, clientId)
      await this.checkFriendship(clientId, receiverId)
      const { directChatId, timestamp, content } = msgPayload

      // Content đã được mã hóa bởi interceptor
      switch (type) {
         case EMessageTypes.TEXT:
            await this.handleMessage(
               { id: clientId, socket: client },
               {
                  content, // Content đã được mã hóa
                  timestamp,
                  directChatId,
                  receiverId,
                  type: EMessageTypes.TEXT,
               }
            )
            break
         case EMessageTypes.STICKER:
            await this.handleMessage(
               { id: clientId, socket: client },
               {
                  content: '',
                  timestamp,
                  directChatId,
                  receiverId,
                  type: EMessageTypes.STICKER,
                  stickerUrl: content,
               }
            )
            break
      }
      return { success: true }
   }

   @SubscribeMessage(EClientSocketEvents.message_seen_direct)
   @CatchInternalSocketError()
   async handleMarkAsSeenInDirectChat(
      @MessageBody() data: MarkAsSeenDTO,
      @ConnectedSocket() client: TClientSocket
   ) {
      const { messageId, receiverId } = data
      await this.DirectMessageService.updateMessageStatus(messageId, EMessageStatus.SEEN)
      const recipientSocket = this.socketService.getConnectedClient<IEmitSocketEvents>(receiverId)
      if (recipientSocket) {
         recipientSocket.emit(EClientSocketEvents.message_seen_direct, {
            messageId,
            status: EMessageStatus.SEEN,
         })
      }
   }

   @SubscribeMessage(EClientSocketEvents.typing_direct)
   @CatchInternalSocketError()
   async handleTyping(@MessageBody() data: TypingDTO, @ConnectedSocket() client: TClientSocket) {
      const { clientId } = await this.authService.validateSocketAuth(client)
      const { receiverId, isTyping } = data
      const recipientSocket = this.socketService.getConnectedClient<IEmitSocketEvents>(receiverId)
      if (recipientSocket) {
         recipientSocket.emit(EClientSocketEvents.typing_direct, isTyping)
         if (isTyping) {
            this.convTypingManager.initTyping(clientId, recipientSocket)
         } else {
            this.convTypingManager.removeTyping(clientId)
         }
      }
   }
}

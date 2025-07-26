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
import { ConversationTypingManager } from './helpers/conversation-typing.helper'
import { SyncDataToESService } from '@/configs/elasticsearch/sync-data-to-ES/sync-data-to-ES.service'
// import { GatewayInterceptor } from './gateway.interceptor'
import { DevLogger } from '@/dev/dev-logger'
import type { TDirectChat } from '@/utils/entities/direct-chat.entity'
import { Socket } from 'socket.io'

@WebSocketGateway({
  cors: {
    origin:
      process.env.NODE_ENV === 'production' ? process.env.CLIENT_HOST : process.env.CLIENT_HOST_DEV,
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
    DevLogger.logForWebsocket('connected socket:', {
      socketId: client.id,
      auth: client.handshake.auth,
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
      DevLogger.logForWebsocket('error at handleConnection:', error)
      client.disconnect(true)
    }
  }

  /**
   * This function is called when a client disconnects from the server.
   * It removes the client from the connected clients list and the message tokens.
   * @param client - The client instance.
   */
  async handleDisconnect(client: TClientSocket): Promise<void> {
    DevLogger.logForWebsocket('disconnected socket:', {
      socketId: client.id,
      auth: client.handshake.auth,
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
    groupChatId?: number,
    limit?: number
  ): Promise<void> {
    if (directChatId) {
      const messages = await this.DirectMessageService.getNewerDirectMessages(
        messageOffset,
        directChatId,
        limit ?? 20
      )
      if (messages && messages.length > 0) {
        clientSocket.emit(EClientSocketEvents.recovered_connection, messages)
      }
    }
  }

  async checkUniqueMessage(token: string, clientId: number): Promise<void> {
    if (!this.messageTokensManager.isUniqueToken(clientId, token)) {
      throw new BaseWsException(EMsgMessages.MESSAGE_OVERLAPS)
    }
  }

  async handleDirectChatNotExists(creatorId: number, recipientId: number): Promise<TDirectChat> {
    let directChat = await this.directChatService.findConversationWithOtherUser(
      creatorId,
      recipientId
    )
    if (!directChat) {
      directChat = await this.directChatService.createNewDirectChat(creatorId, recipientId)
    }
    return directChat
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
      mediaUrl?: string
      fileName?: string
      thumbnailUrl?: string
      replyToId?: number
    }
  ): Promise<void> {
    const { id, socket } = client
    const {
      content,
      timestamp,
      directChatId,
      receiverId,
      stickerUrl,
      type,
      fileName,
      mediaUrl,
      thumbnailUrl,
      replyToId,
    } = message
    const newMessage = await this.DirectMessageService.createNewMessage(
      content,
      id,
      timestamp,
      directChatId,
      receiverId,
      type as any,
      stickerUrl,
      mediaUrl,
      fileName,
      thumbnailUrl,
      replyToId
    )
    await this.directChatService.updateLastSentMessage(directChatId, newMessage.id)
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
    const { clientId } = await this.authService.validateSocketAuth(client)
    const { type, msgPayload } = payload
    const { receiverId, token } = msgPayload

    await this.checkUniqueMessage(token, clientId)
    const { timestamp, content, replyToId } = msgPayload

    const directChat = await this.handleDirectChatNotExists(clientId, receiverId)
    const { id: directChatId } = directChat

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
            replyToId,
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
            replyToId,
          }
        )
        break
      case EMessageTypes.IMAGE:
        await this.handleMessage(
          { id: clientId, socket: client },
          {
            content: '',
            timestamp,
            directChatId,
            receiverId,
            type: EMessageTypes.IMAGE,
            mediaUrl: msgPayload.mediaUrl,
            replyToId,
          }
        )
        break
      case EMessageTypes.VIDEO:
        await this.handleMessage(
          { id: clientId, socket: client },
          {
            content: '',
            timestamp,
            directChatId,
            receiverId,
            type: EMessageTypes.VIDEO,
            mediaUrl: msgPayload.mediaUrl,
            thumbnailUrl: msgPayload.thumbnailUrl,
            replyToId,
          }
        )
        break
      case EMessageTypes.DOCUMENT:
        console.log('📄 Gateway - Xử lý tin nhắn DOCUMENT:', {
          content: msgPayload.content,
          mediaUrl: msgPayload.mediaUrl,
          fileName: msgPayload.fileName,
          receiverId,
          directChatId,
          replyToId,
        })
        await this.handleMessage(
          { id: clientId, socket: client },
          {
            content: msgPayload.content || '', // Tên file
            timestamp,
            directChatId,
            receiverId,
            type: EMessageTypes.DOCUMENT,
            mediaUrl: msgPayload.mediaUrl,
            fileName: msgPayload.fileName,
            replyToId,
          }
        )
        break
      case EMessageTypes.AUDIO:
        console.log('🎵 Gateway - Xử lý tin nhắn AUDIO:', {
          content: msgPayload.content,
          mediaUrl: msgPayload.mediaUrl,
          fileName: msgPayload.fileName,
          receiverId,
          directChatId,
        })
        await this.handleMessage(
          { id: clientId, socket: client },
          {
            content: msgPayload.content || '', // Caption nếu có
            timestamp,
            directChatId,
            receiverId,
            type: EMessageTypes.AUDIO,
            mediaUrl: msgPayload.mediaUrl,
            fileName: msgPayload.fileName,
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

  @SubscribeMessage('join_room')
  handleJoinRoom(@MessageBody() data: { room: string }, @ConnectedSocket() client: Socket) {
    client.join(data.room)
    client.emit('joined_room', data.room)
    console.log('[SERVER] Socket', client.id, 'joined room', data.room)
  }
}

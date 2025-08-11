import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets'
import type { OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect } from '@nestjs/websockets'
import { Server } from 'socket.io'
import { EClientSocketEvents, EInitEvents } from './gateway.event'
import { EMessageTypeAllTypes, ESocketNamespaces } from './gateway.enum'
import {
  HttpStatus,
  UseFilters,
  UsePipes,
  UseInterceptors,
  ForbiddenException,
  BadGatewayException,
} from '@nestjs/common'
import { FriendService } from '@/friend/friend.service'
import { BaseWsException } from '../utils/exceptions/base-ws.exception'
import { EFriendMessages } from '@/friend/friend.message'
import {
  CatchInternalSocketError,
  BaseWsExceptionsFilter,
} from '@/utils/exception-filters/base-ws-exception.filter'
import { DirectMessageService } from '@/direct-message/direct-message.service'
import type {
  TCheckCanSendMessageInGroupChat,
  TClientSocket,
  TFindDirectChatWithOtherUser,
  THandleEmitNewMessageParams,
  THandleMessageParamsClient,
  THandleMessageParamsMessage,
} from './gateway.type'
import type { IEmitSocketEvents, IGateway } from './gateway.interface'
import { wsValidationPipe } from './gateway.validation'
import { SocketService } from './socket/socket.service'
import {
  MarkAsSeenDTO,
  TypingDTO,
  SendDirectMessageDTO,
  JoinGroupChatDTO,
  SendGroupMessageDTO,
  CheckUserOnlineDTO,
  JoinDirectChatDTO,
} from './gateway.dto'
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
import { TMessageFullInfo } from '@/utils/entities/message.entity'
import { EChatType, EInternalEvents, EUserOnlineStatus } from '@/utils/enums'
import { UserService } from '@/user/user.service'
import { EGatewayMessages } from './gateway.message'
import { GatewayInterceptor } from './gateway.interceptor'
import { GroupChatService } from '@/group-chat/group-chat.service'
import { TGroupChat } from '@/utils/entities/group-chat.entity'
import { TUserWithProfile } from '@/utils/entities/user.entity'
import { OnEvent } from '@nestjs/event-emitter'
import { GroupMemberService } from '@/group-member/group-member.service'
import { createDirectChatRoomName, createGroupChatRoomName } from '@/utils/helpers'
import { UserSettingsService } from '@/user-settings/user-settings.service'
import { BlockUserService } from '@/user/block-user.service'
import { EUserSettingsMessages } from '@/user-settings/user-settings.message'
import { EUserMessages } from '@/user/user.message'
import { EGroupMemberMessages } from '@/group-member/group-member.message'
import { EGroupChatPermissions, EGroupChatRoles } from '@/group-chat/group-chat.enum'

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
@UseInterceptors(GatewayInterceptor)
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
    private messageService: DirectMessageService,
    private authService: AuthService,
    private directChatService: DirectChatService,
    private syncDataToESService: SyncDataToESService,
    private userService: UserService,
    private groupChatService: GroupChatService,
    private groupMemberService: GroupMemberService,
    private userSettingsService: UserSettingsService,
    private blockUserService: BlockUserService
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
      this.socketService.broadcastUserOnlineStatus(clientId, EUserOnlineStatus.ONLINE)
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
    const { clientId: userId } = client.handshake.auth
    if (userId) {
      this.socketService.removeConnectedClient(userId, client.id)
      this.socketService.broadcastUserOnlineStatus(userId, EUserOnlineStatus.OFFLINE)
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
      const messages = await this.messageService.getNewerDirectMessages(
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

  async handleDirectChatNotExists(
    creatorId: number,
    recipientId: number
  ): Promise<TFindDirectChatWithOtherUser> {
    const directChat = await this.directChatService.findConversationWithOtherUser(
      creatorId,
      recipientId
    )
    if (directChat) {
      return { directChat, isNew: false }
    }
    const newDirectChat = await this.directChatService.createNewDirectChat(creatorId, recipientId)
    return { directChat: newDirectChat, isNew: true }
  }

  async handleEmitNewMessage({
    client,
    receiverId,
    newMessage,
    isNewDirectChat,
    directChat,
    groupChat,
    sender,
  }: THandleEmitNewMessageParams): Promise<void> {
    if (directChat && receiverId) {
      const { socket } = client
      socket.emit(EClientSocketEvents.send_message_direct, newMessage)
      this.socketService.sendNewMessageToRecipient(
        receiverId,
        newMessage,
        isNewDirectChat || false,
        directChat,
        sender
      )
      if (isNewDirectChat) {
        socket.emit(
          EClientSocketEvents.new_conversation,
          directChat,
          null,
          EChatType.DIRECT,
          newMessage,
          sender
        )
      }
    } else if (groupChat) {
      this.socketService.sendNewMessageToGroupChat(groupChat.id, newMessage)
    }
  }

  async handleMessage(
    client: THandleMessageParamsClient,
    message: THandleMessageParamsMessage
  ): Promise<TMessageFullInfo> {
    const { id } = client
    const {
      content,
      timestamp,
      directChatId,
      receiverId,
      groupId,
      stickerId,
      type,
      mediaId,
      replyToId,
    } = message
    if (directChatId && receiverId) {
      const newMessage = await this.messageService.createNewMessage(
        content,
        id,
        timestamp,
        type,
        receiverId,
        stickerId,
        mediaId,
        replyToId,
        directChatId
      )
      await this.directChatService.updateLastSentMessage(directChatId, newMessage.id)
      return newMessage
    } else if (groupId) {
      const newMessage = await this.messageService.createNewMessage(
        content,
        id,
        timestamp,
        type,
        undefined,
        stickerId,
        mediaId,
        replyToId,
        undefined,
        groupId
      )
      return newMessage
    }
    throw new BaseWsException(EGatewayMessages.INVALID_MESSAGE_TYPE)
  }

  async checkCanSendMessageInDirectChat(clientId: number, receiverId: number): Promise<void> {
    const settings = await this.userSettingsService.findByUserId(receiverId)
    if (settings?.onlyReceiveFriendMessage) {
      const isFriend = await this.friendService.isFriend(clientId, receiverId)
      if (isFriend) return
      throw new ForbiddenException(EUserSettingsMessages.ONLY_RECEIVE_FRIEND_MESSAGE)
    }
    const isBlocked = await this.blockUserService.checkBlockedUser(clientId, receiverId)
    if (isBlocked?.blockedUserId === clientId)
      throw new ForbiddenException(EUserMessages.YOU_ARE_BLOCKED_BY_THIS_USER)
    if (isBlocked?.blockedUserId === receiverId)
      throw new ForbiddenException(EUserMessages.YOU_HAVE_BLOCKED_THIS_USER)
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

    await this.checkCanSendMessageInDirectChat(clientId, receiverId)

    await this.checkUniqueMessage(token, clientId)
    const { timestamp, content, replyToId } = msgPayload

    const { directChat, isNew } = await this.handleDirectChatNotExists(clientId, receiverId)
    const { id: directChatId } = directChat

    const sender = await this.userService.findUserWithProfileById(clientId)
    if (!sender) {
      throw new BaseWsException(EGatewayMessages.SENDER_NOT_FOUND)
    }

    let newMessage: TMessageFullInfo

    switch (type) {
      case EMessageTypeAllTypes.TEXT:
        newMessage = await this.handleMessage(
          { id: clientId, socket: client },
          {
            content,
            timestamp,
            directChatId,
            receiverId,
            type: EMessageTypes.TEXT,
            replyToId,
          }
        )
        break
      case EMessageTypeAllTypes.STICKER:
        newMessage = await this.handleMessage(
          { id: clientId, socket: client },
          {
            content: '',
            timestamp,
            directChatId,
            receiverId,
            type: EMessageTypes.STICKER,
            stickerId: parseInt(content),
            replyToId,
          }
        )
        break
      case EMessageTypeAllTypes.IMAGE:
        newMessage = await this.handleMessage(
          { id: clientId, socket: client },
          {
            content: '',
            timestamp,
            directChatId,
            receiverId,
            type: EMessageTypes.MEDIA,
            mediaId: parseInt(content),
            replyToId,
          }
        )
        break
      case EMessageTypeAllTypes.VIDEO:
        newMessage = await this.handleMessage(
          { id: clientId, socket: client },
          {
            content: '',
            timestamp,
            directChatId,
            receiverId,
            type: EMessageTypes.MEDIA,
            mediaId: parseInt(content),
            replyToId,
          }
        )
        break
      case EMessageTypeAllTypes.DOCUMENT:
        newMessage = await this.handleMessage(
          { id: clientId, socket: client },
          {
            content: msgPayload.content || '', // Tên file
            timestamp,
            directChatId,
            receiverId,
            type: EMessageTypes.MEDIA,
            mediaId: parseInt(content),
            replyToId,
          }
        )
        break
      case EMessageTypeAllTypes.AUDIO:
        newMessage = await this.handleMessage(
          { id: clientId, socket: client },
          {
            content: msgPayload.content || '', // Caption nếu có
            timestamp,
            directChatId,
            receiverId,
            type: EMessageTypes.MEDIA,
            mediaId: parseInt(content),
            replyToId,
          }
        )
        break
      default:
        throw new BaseWsException(EGatewayMessages.INVALID_MESSAGE_FORMAT)
    }

    await this.handleEmitNewMessage({
      client: { id: clientId, socket: client },
      receiverId,
      newMessage,
      isNewDirectChat: isNew,
      directChat,
      sender,
    })

    return {
      success: true,
      newMessage,
    }
  }

  @SubscribeMessage(EClientSocketEvents.message_seen_direct)
  @CatchInternalSocketError()
  async handleMarkAsSeenInDirectChat(
    @MessageBody() data: MarkAsSeenDTO,
    @ConnectedSocket() client: TClientSocket
  ) {
    const { messageId, receiverId } = data
    await this.messageService.updateMessageStatus(messageId, EMessageStatus.SEEN)
    const recipientSockets = this.socketService.getConnectedClient<IEmitSocketEvents>(receiverId)
    if (recipientSockets && recipientSockets.length > 0) {
      for (const socket of recipientSockets) {
        socket.emit(EClientSocketEvents.message_seen_direct, {
          messageId,
          status: EMessageStatus.SEEN,
        })
      }
    }
  }

  @SubscribeMessage(EClientSocketEvents.typing_direct)
  @CatchInternalSocketError()
  async handleTyping(@MessageBody() data: TypingDTO, @ConnectedSocket() client: TClientSocket) {
    const { clientId } = await this.authService.validateSocketAuth(client)
    const { receiverId, isTyping, directChatId } = data
    const recipientSockets = this.socketService.getConnectedClient<IEmitSocketEvents>(receiverId)
    if (recipientSockets && recipientSockets.length > 0) {
      for (const socket of recipientSockets) {
        socket.emit(EClientSocketEvents.typing_direct, isTyping, directChatId)
        if (isTyping) {
          this.convTypingManager.initTyping(clientId, socket, directChatId)
        } else {
          this.convTypingManager.removeTyping(clientId)
        }
      }
    }
  }

  @SubscribeMessage(EClientSocketEvents.join_group_chat_room)
  @CatchInternalSocketError()
  async handleJoinGroupChat(
    @MessageBody() data: JoinGroupChatDTO,
    @ConnectedSocket() client: Socket
  ) {
    const { groupChatId } = data
    client.join(createGroupChatRoomName(groupChatId))
    return {
      success: true,
    }
  }

  async checkCanSendMessageInGroupChat(
    clientId: number,
    messageType: EMessageTypeAllTypes,
    groupChatId: number
  ): Promise<TCheckCanSendMessageInGroupChat> {
    const member = await this.groupMemberService.findMemberInGroupChat(groupChatId, clientId)
    if (!member) {
      throw new BadGatewayException(EGatewayMessages.USER_NOT_IN_GROUP_CHAT)
    }
    if (member.role !== EGroupChatRoles.ADMIN) {
      const hasPermission = await this.groupChatService.checkGroupChatPermission(
        groupChatId,
        messageType === EMessageTypeAllTypes.PIN_NOTICE
          ? EGroupChatPermissions.PIN_MESSAGE
          : EGroupChatPermissions.SEND_MESSAGE
      )
      if (!hasPermission) {
        throw new BadGatewayException(EGroupMemberMessages.USER_HAS_NO_PERMISSION_SEND_MESSAGE)
      }
    }
    return { member }
  }

  @SubscribeMessage(EClientSocketEvents.send_message_group)
  @CatchInternalSocketError()
  async handleSendGroupMessage(
    @MessageBody() payload: SendGroupMessageDTO,
    @ConnectedSocket() client: TClientSocket
  ) {
    const { clientId } = await this.authService.validateSocketAuth(client)
    const { type, msgPayload } = payload
    const { groupChatId, token } = msgPayload

    await this.checkUniqueMessage(token, clientId)
    const { timestamp, content, replyToId } = msgPayload

    const { member } = await this.checkCanSendMessageInGroupChat(clientId, type, groupChatId)

    const groupChat = member.GroupChat
    let newMessage: TMessageFullInfo

    switch (type) {
      case EMessageTypeAllTypes.TEXT:
        newMessage = await this.handleMessage(
          { id: clientId, socket: client },
          {
            content,
            timestamp,
            groupId: groupChatId,
            type: EMessageTypes.TEXT,
            replyToId,
          }
        )
        break
      case EMessageTypeAllTypes.STICKER:
        newMessage = await this.handleMessage(
          { id: clientId, socket: client },
          {
            content: '',
            timestamp,
            groupId: groupChatId,
            type: EMessageTypes.STICKER,
            stickerId: parseInt(content),
            replyToId,
          }
        )
        break
      case EMessageTypeAllTypes.IMAGE:
        newMessage = await this.handleMessage(
          { id: clientId, socket: client },
          {
            content: '',
            timestamp,
            groupId: groupChatId,
            type: EMessageTypes.MEDIA,
            mediaId: parseInt(content),
            replyToId,
          }
        )
        break
      case EMessageTypeAllTypes.VIDEO:
        newMessage = await this.handleMessage(
          { id: clientId, socket: client },
          {
            content: '',
            timestamp,
            groupId: groupChatId,
            type: EMessageTypes.MEDIA,
            mediaId: parseInt(content),
            replyToId,
          }
        )
        break
      case EMessageTypeAllTypes.DOCUMENT:
        newMessage = await this.handleMessage(
          { id: clientId, socket: client },
          {
            content: msgPayload.content || '', // Tên file
            timestamp,
            groupId: groupChatId,
            type: EMessageTypes.MEDIA,
            mediaId: parseInt(content),
            replyToId,
          }
        )
        break
      case EMessageTypeAllTypes.AUDIO:
        newMessage = await this.handleMessage(
          { id: clientId, socket: client },
          {
            content: msgPayload.content || '', // Caption nếu có
            timestamp,
            groupId: groupChatId,
            type: EMessageTypes.MEDIA,
            mediaId: parseInt(content),
            replyToId,
          }
        )
        break
      default:
        throw new BaseWsException(EGatewayMessages.INVALID_MESSAGE_FORMAT)
    }

    await this.handleEmitNewMessage({
      client: { id: clientId, socket: client },
      newMessage,
      sender: member.User,
      groupChat,
    })

    return {
      success: true,
      newMessage,
    }
  }

  @SubscribeMessage(EClientSocketEvents.check_user_online_status)
  @CatchInternalSocketError()
  async handleCheckUserOnlineStatus(@MessageBody() data: CheckUserOnlineDTO) {
    const { userId } = data
    return {
      success: true,
      onlineStatus: this.socketService.getUserOnlineStatus(userId),
    }
  }

  @SubscribeMessage(EClientSocketEvents.join_direct_chat_room)
  @CatchInternalSocketError()
  async handleJoinDirectChat(
    @MessageBody() data: JoinDirectChatDTO,
    @ConnectedSocket() client: TClientSocket
  ) {
    const { directChatId } = data
    client.join(createDirectChatRoomName(directChatId))
    return {
      success: true,
    }
  }

  @OnEvent(EInternalEvents.REMOVE_GROUP_CHAT_MEMBERS)
  async broadcastRemoveGroupChatMembers(groupChat: TGroupChat, removedMemberIds: number[]) {
    this.socketService.broadcastRemoveGroupChatMembers(groupChat, removedMemberIds)
  }

  @OnEvent(EInternalEvents.ADD_MEMBERS_TO_GROUP_CHAT)
  async broadcastAddMembersToGroupChat(
    groupChat: TGroupChat,
    newMemberIds: number[],
    executor: TUserWithProfile
  ) {
    this.socketService.broadcastAddMembersToGroupChat(groupChat, newMemberIds, executor)
  }

  @OnEvent(EInternalEvents.CREATE_GROUP_CHAT)
  async broadcastCreateGroupChat(
    groupChat: TGroupChat,
    groupMemberIds: number[],
    creator: TUserWithProfile
  ) {
    this.socketService.broadcastCreateGroupChat(groupChat, groupMemberIds, creator)
  }
}

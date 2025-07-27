import { Injectable } from '@nestjs/common'
import type {
  TGlobalSearchData,
  TMessageSearchOffset,
  TUserSearchOffset,
  TConversationSearchResult,
} from './search.type'
import { ElasticsearchService } from '@/configs/elasticsearch/elasticsearch.service'
import { DirectMessageService } from '@/direct-message/direct-message.service'
import { UserService } from '@/user/user.service'
import { replaceHTMLTagInMessageContent } from '@/utils/helpers'
import { GroupMessageService } from '@/group-message/group-message.service'
import { EChatType } from '@/utils/enums'
import { SocketService } from '@/gateway/socket/socket.service'
import { DirectChatService } from '@/direct-chat/direct-chat.service'
import { GroupChatService } from '@/group-chat/group-chat.service'
import { PrismaService } from '@/configs/db/prisma.service'
import { EProviderTokens } from '@/utils/enums'
import { Inject } from '@nestjs/common'

@Injectable()
export class SearchService {
  constructor(
    private elasticSearchService: ElasticsearchService,
    private directMessageService: DirectMessageService,
    private groupMessageService: GroupMessageService,
    private userService: UserService,
    private socketService: SocketService,
    private directChatService: DirectChatService,
    private groupChatService: GroupChatService,
    @Inject(EProviderTokens.PRISMA_CLIENT) private prismaService: PrismaService
  ) {}

  async searchGlobally(
    keyword: string,
    userId: number,
    isFirstSearch: boolean,
    limit: number,
    selfUserId: number,
    messageSearchOffset?: TMessageSearchOffset,
    userSearchOffset?: TUserSearchOffset
  ): Promise<TGlobalSearchData> {
    const [messageHits, userHits] = await Promise.all([
      this.elasticSearchService.searchMessages(
        keyword,
        userId,
        limit,
        isFirstSearch ? undefined : messageSearchOffset
      ),
      this.elasticSearchService.searchUsers(
        keyword,
        limit,
        isFirstSearch ? undefined : userSearchOffset
      ),
    ])
    const messageIdObjects = messageHits
      .filter((message) => !!message._source)
      .map((message) => ({
        id: parseInt(message._id!),
        highlight: message.highlight,
      }))
    const messageIds = messageIdObjects.map((message) => message.id)
    const userIds = userHits.filter((user) => !!user._source).map((user) => parseInt(user._id!))
    // find direct messages and users by ids in database
    const [directMessages, groupMessages, users] = await Promise.all([
      this.directMessageService.findMessagesByIds(messageIds, limit),
      this.groupMessageService.findMessagesByIds(messageIds, limit),
      this.userService.findUsersByIdsNotSelfUser(userIds, selfUserId, limit),
    ])
    const finalMessages = [
      ...directMessages.map(({ id, Recipient, content, directChatId, createdAt }) => ({
        id,
        avatarUrl: Recipient.Profile!.avatar || undefined,
        conversationName: Recipient.Profile!.fullName,
        messageContent: replaceHTMLTagInMessageContent(content),
        highlights: messageIdObjects.find((m) => m.id === id)!.highlight?.content || [],
        chatType: EChatType.DIRECT,
        chatId: directChatId,
        createdAt: createdAt.toISOString(),
      })),
      ...groupMessages.map(({ id, GroupChat, content, groupChatId, createdAt }) => ({
        id,
        avatarUrl: GroupChat.avatarUrl || undefined,
        conversationName: GroupChat.name,
        messageContent: replaceHTMLTagInMessageContent(content),
        highlights: messageIdObjects.find((m) => m.id === id)!.highlight?.content || [],
        chatType: EChatType.GROUP,
        chatId: groupChatId,
        createdAt: createdAt.toISOString(),
      })),
    ]
    const finalUsers = users.map((user) => ({
      ...user,
      isOnline: this.socketService.checkUserOnlineStatus(user.id),
    }))
    return {
      messages: finalMessages,
      users: finalUsers,
    }
  }

  async searchConversations(
    keyword: string,
    userId: number,
    limit: number = 10
  ): Promise<TConversationSearchResult[]> {
    const searchKeyword = keyword.toLowerCase().trim()

    // Tìm kiếm direct chats
    const directChats = await this.prismaService.directChat.findMany({
      where: {
        AND: [
          {
            OR: [{ creatorId: userId }, { recipientId: userId }],
          },
          {
            OR: [
              {
                Creator: {
                  Profile: {
                    fullName: {
                      contains: searchKeyword,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                Recipient: {
                  Profile: {
                    fullName: {
                      contains: searchKeyword,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                Creator: {
                  email: {
                    contains: searchKeyword,
                    mode: 'insensitive',
                  },
                },
              },
              {
                Recipient: {
                  email: {
                    contains: searchKeyword,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          },
        ],
      },
      include: {
        Creator: {
          include: {
            Profile: true,
          },
        },
        Recipient: {
          include: {
            Profile: true,
          },
        },
        LastSentMessage: true,
      },
      take: limit,
    })

    // Tìm kiếm group chats
    const groupChats = await this.prismaService.groupChat.findMany({
      where: {
        Members: {
          some: {
            userId: userId,
          },
        },
        name: {
          contains: searchKeyword,
          mode: 'insensitive',
        },
      },
      include: {
        LastSentMessage: true,
      },
      take: limit,
    })

    // Chuyển đổi direct chats thành format mong muốn
    const directChatResults: TConversationSearchResult[] = directChats.map((chat) => {
      const otherUser = chat.creatorId === userId ? chat.Recipient : chat.Creator
      return {
        id: chat.id,
        type: EChatType.DIRECT,
        title: otherUser.Profile?.fullName || otherUser.email,
        avatar: otherUser.Profile?.avatar ? { src: otherUser.Profile.avatar } : undefined,
        subtitle: chat.LastSentMessage ? { content: chat.LastSentMessage.content } : undefined,
      }
    })

    // Chuyển đổi group chats thành format mong muốn
    const groupChatResults: TConversationSearchResult[] = groupChats.map((chat) => ({
      id: chat.id,
      type: EChatType.GROUP,
      title: chat.name,
      avatar: chat.avatarUrl ? { src: chat.avatarUrl } : undefined,
      subtitle: chat.LastSentMessage ? { content: chat.LastSentMessage.content } : undefined,
    }))

    // Kết hợp và giới hạn kết quả
    const allResults = [...directChatResults, ...groupChatResults]
    return allResults.slice(0, limit)
  }
}

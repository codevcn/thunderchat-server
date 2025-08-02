import { Inject, Injectable } from '@nestjs/common'
import { PrismaService } from '@/configs/db/prisma.service'
import { EProviderTokens } from '@/utils/enums'
import { EMessageTypes } from '@/direct-message/direct-message.enum'
import { EMediaTypes, ESortOrder } from './media-message.enum'
import type {
  TMediaItem,
  TPaginationInfo,
  TGetMediaMessagesResponse,
  TMediaFilters,
} from '@/direct-message/media-message/media-message.type'
import dayjs from 'dayjs'

@Injectable()
export class MediaMessageService {
  constructor(@Inject(EProviderTokens.PRISMA_CLIENT) private PrismaService: PrismaService) {}

  private readonly messageIncludeAuthor = {
    Author: {
      include: {
        Profile: true,
      },
    },
  }

  /**
   * Get media messages with pagination and filters
   */
  async getMediaMessages(
    directChatId: number,
    filters: TMediaFilters = {},
    page: number = 1,
    limit: number = 20,
    sort: ESortOrder = ESortOrder.DESC
  ): Promise<TGetMediaMessagesResponse> {
    try {
      // Build where clause
      const whereClause = this.buildWhereClause(directChatId, filters)

      // Calculate offset
      const offset = (page - 1) * limit

      // Get total count
      const totalItems = await this.PrismaService.directMessage.count({
        where: whereClause,
      })

      // Get items
      const items = await this.PrismaService.directMessage.findMany({
        where: whereClause,
        include: this.messageIncludeAuthor,
        orderBy: {
          createdAt: sort === ESortOrder.ASC ? 'asc' : 'desc',
        },
        take: limit,
        skip: offset,
      })

      // Calculate pagination info
      const totalPages = Math.ceil(totalItems / limit)
      const hasMore = page < totalPages

      const pagination: TPaginationInfo = {
        currentPage: page,
        totalPages,
        totalItems,
        hasMore,
        limit,
      }

      const result: TGetMediaMessagesResponse = {
        success: true,
        data: {
          items: items as TMediaItem[],
          pagination,
        },
      }

      return result
    } catch (error) {
      console.error('[MediaMessageService] Error getting media messages:', error)
      return {
        success: false,
        data: {
          items: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            hasMore: false,
            limit,
          },
        },
        message: 'Failed to get media messages',
        errorCode: 'MEDIA_FETCH_ERROR',
        errors: error,
      }
    }
  }

  /**
   * Build where clause for database query
   */
  private buildWhereClause(directChatId: number, filters: TMediaFilters) {
    const baseWhere = {
      directChatId,
      isDeleted: false,
      type: {
        in: [
          EMessageTypes.IMAGE,
          EMessageTypes.VIDEO,
          EMessageTypes.DOCUMENT,
          EMessageTypes.AUDIO,
          EMessageTypes.TEXT,
        ],
      }, // Include real media types + TEXT (for links)
    }

    // Handle media type filter
    let typeCondition = {}

    // Priority: types array > single type > default
    if (filters.types && filters.types.length > 0) {
      // Handle multiple types
      const backendTypes: EMessageTypes[] = []
      filters.types.forEach((type) => {
        switch (type) {
          case EMediaTypes.IMAGE:
            backendTypes.push(EMessageTypes.IMAGE)
            break
          case EMediaTypes.VIDEO:
            backendTypes.push(EMessageTypes.VIDEO)
            break
          case EMediaTypes.FILE:
            backendTypes.push(EMessageTypes.DOCUMENT)
            break
          case EMediaTypes.VOICE:
            backendTypes.push(EMessageTypes.AUDIO)
            break
        }
      })
      typeCondition = { type: { in: backendTypes } }
    } else if (filters.type) {
      // Handle single type
      switch (filters.type) {
        case EMediaTypes.IMAGE:
          typeCondition = { type: EMessageTypes.IMAGE }
          break
        case EMediaTypes.VIDEO:
          typeCondition = { type: EMessageTypes.VIDEO }
          break
        case EMediaTypes.FILE:
          typeCondition = { type: EMessageTypes.DOCUMENT }
          break
        case EMediaTypes.VOICE:
          typeCondition = { type: EMessageTypes.AUDIO }
          break
        default:
          // If no specific type, get all real media types + TEXT
          typeCondition = {
            type: {
              in: [
                EMessageTypes.IMAGE,
                EMessageTypes.VIDEO,
                EMessageTypes.DOCUMENT,
                EMessageTypes.AUDIO,
                EMessageTypes.TEXT,
              ],
            },
          }
      }
    } else {
      // Default: get all real media types + TEXT messages (for links)
      typeCondition = {
        type: {
          in: [
            EMessageTypes.IMAGE,
            EMessageTypes.VIDEO,
            EMessageTypes.DOCUMENT,
            EMessageTypes.AUDIO,
            EMessageTypes.TEXT,
          ],
        },
      }
    }

    // Handle sender filter
    const senderCondition = filters.senderId ? { authorId: filters.senderId } : {}

    // Handle date filters
    let dateCondition = {}
    if (filters.fromDate || filters.toDate) {
      const dateFilter: any = {}
      if (filters.fromDate) {
        dateFilter.gte = dayjs(filters.fromDate).startOf('day').toDate()
      }
      if (filters.toDate) {
        dateFilter.lte = dayjs(filters.toDate).endOf('day').toDate()
      }
      dateCondition = { createdAt: dateFilter }
    }

    return {
      ...baseWhere,
      ...typeCondition,
      ...senderCondition,
      ...dateCondition,
    }
  }

  /**
   * Get media statistics for a chat
   */
  async getMediaStatistics(directChatId: number) {
    try {
      console.log('[MediaMessageService] Fetching media statistics from database...')

      const stats = await this.PrismaService.directMessage.groupBy({
        by: ['type'],
        where: {
          directChatId,
          isDeleted: false,
          type: {
            in: [
              EMessageTypes.IMAGE,
              EMessageTypes.VIDEO,
              EMessageTypes.DOCUMENT,
              EMessageTypes.AUDIO,
            ],
          }, // Only include real media types
        },
        _count: {
          type: true,
        },
      })

      const result = {
        total: 0,
        images: 0,
        videos: 0,
        files: 0,
        voices: 0,
      }

      stats.forEach((stat) => {
        const count = stat._count.type
        result.total += count

        switch (stat.type) {
          case EMessageTypes.IMAGE:
            result.images = count
            break
          case EMessageTypes.VIDEO:
            result.videos = count
            break
          case EMessageTypes.DOCUMENT:
            result.files = count
            break
          case EMessageTypes.AUDIO:
            result.voices = count
            break
        }
      })

      const response = {
        success: true,
        data: result,
      }

      return response
    } catch (error) {
      console.error('[MediaMessageService] Error getting media statistics:', error)
      return {
        success: false,
        data: null,
        message: 'Failed to get media statistics',
        errorCode: 'MEDIA_STATS_ERROR',
        errors: error,
      }
    }
  }
}

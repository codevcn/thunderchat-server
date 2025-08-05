import { Inject, Injectable } from '@nestjs/common'
import { PrismaService } from '@/configs/db/prisma.service'
import { EProviderTokens } from '@/utils/enums'
import { EMessageMediaTypes, EMessageTypes } from '@/direct-message/direct-message.enum'
import { EMediaTypes, ESortOrder } from './media-message.enum'
import type {
  TMediaItem,
  TPaginationInfo,
  TGetMediaMessagesResponse,
  TMediaFilters,
  TCountMessageMedia,
} from '@/direct-message/media-message/media-message.type'
import dayjs from 'dayjs'
import { countMessageMedia } from '@prisma/client/sql'

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
      const totalItems = await this.PrismaService.message.count({
        // where: whereClause,
      })

      // Get items
      const items = await this.PrismaService.message.findMany({
        // where: whereClause,
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
          EMessageMediaTypes.IMAGE.toString(),
          EMessageMediaTypes.VIDEO.toString(),
          EMessageMediaTypes.DOCUMENT.toString(),
          EMessageMediaTypes.AUDIO.toString(),
          EMessageTypes.TEXT.toString(),
        ],
      }, // Include real media types + TEXT (for links)
    }

    // Handle media type filter
    let typeCondition = {}

    // Priority: types array > single type > default
    if (filters.types && filters.types.length > 0) {
      // Handle multiple types
      const backendTypes: string[] = []
      filters.types.forEach((type) => {
        switch (type) {
          case EMediaTypes.IMAGE:
            backendTypes.push(EMessageMediaTypes.IMAGE)
            break
          case EMediaTypes.VIDEO:
            backendTypes.push(EMessageMediaTypes.VIDEO)
            break
          case EMediaTypes.FILE:
            backendTypes.push(EMessageMediaTypes.DOCUMENT)
            break
          case EMediaTypes.VOICE:
            backendTypes.push(EMessageMediaTypes.AUDIO)
            break
        }
      })
      typeCondition = { type: { in: backendTypes } }
    } else if (filters.type) {
      // Handle single type
      switch (filters.type) {
        case EMediaTypes.IMAGE:
          typeCondition = { type: EMessageMediaTypes.IMAGE }
          break
        case EMediaTypes.VIDEO:
          typeCondition = { type: EMessageMediaTypes.VIDEO }
          break
        case EMediaTypes.FILE:
          typeCondition = { type: EMessageMediaTypes.DOCUMENT }
          break
        case EMediaTypes.VOICE:
          typeCondition = { type: EMessageMediaTypes.AUDIO }
          break
        default:
          // If no specific type, get all real media types + TEXT
          typeCondition = {
            type: {
              in: [
                EMessageMediaTypes.IMAGE,
                EMessageMediaTypes.VIDEO,
                EMessageMediaTypes.DOCUMENT,
                EMessageMediaTypes.AUDIO,
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
            EMessageMediaTypes.IMAGE,
            EMessageMediaTypes.VIDEO,
            EMessageMediaTypes.DOCUMENT,
            EMessageMediaTypes.AUDIO,
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

      // const stats = await this.PrismaService.message.groupBy({
      //   by: ['type'],
      //   where: {
      //     directChatId,
      //     isDeleted: false,
      //     type: {
      //       in: [EMessageTypes.TEXT, EMessageTypes.MEDIA],
      //     }, // Only include real media types
      //   },
      //   _count: {
      //     type: true,
      //   },
      // })

      const stats = await this.PrismaService.$queryRawTyped<TCountMessageMedia>(
        countMessageMedia(directChatId)
      )

      const result = {
        total: 0,
        images: 0,
        videos: 0,
        files: 0,
        voices: 0,
      }

      stats.forEach((stat) => {
        const count = Number(stat.total)
        result.total += count!

        const stateType = stat.message_type as EMessageTypes
        const mediaType = stat.message_type as EMessageMediaTypes
        if (stateType === EMessageTypes.MEDIA) {
          result.images = count
        }

        switch (stat.message_type) {
          case EMessageMediaTypes.IMAGE:
            result.images = count
            break
          case EMessageMediaTypes.VIDEO:
            result.videos = count
            break
          case EMessageMediaTypes.DOCUMENT:
            result.files = count
            break
          case EMessageMediaTypes.AUDIO:
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

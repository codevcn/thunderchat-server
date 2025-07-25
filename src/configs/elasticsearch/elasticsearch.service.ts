import { Injectable, OnModuleInit } from '@nestjs/common'
import { Client } from '@elastic/elasticsearch'
import type {
  TESSearchGeneralResult,
  TMessageESMapping,
  TUserESMapping,
} from './elasticsearch.type'
import { EESIndexes } from './elasticsearch.enum'
import type { SearchHit, SearchResponse } from '@elastic/elasticsearch/lib/api/types'

export const ESClient = new Client({
  node: process.env.ELASTICSEARCH_URL,
  auth: { apiKey: process.env.ELASTIC_API_KEY },
})

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.pingToESServer()
  }

  extractESHits<T>(searchResult: SearchResponse<T>): SearchHit<T>[] {
    return searchResult.hits.hits
  }

  async pingToESServer(): Promise<void> {
    try {
      const result = await ESClient.ping()
      console.log('>>> Elasticsearch ping result:', result)
    } catch (error) {
      console.error('>>> Elasticsearch ping failed:', error)
    }
  }

  async deleteAllDataFromES(): Promise<void> {
    // Xóa tất cả các document trong index DIRECT_MESSAGES
    await ESClient.deleteByQuery({
      index: EESIndexes.DIRECT_MESSAGES,
      query: { match_all: {} },
      refresh: true,
    })
    // Xóa tất cả các document trong index USERS
    await ESClient.deleteByQuery({
      index: EESIndexes.USERS,
      query: { match_all: {} },
      refresh: true,
    })
  }

  async createMessage(messageId: number, message: TMessageESMapping): Promise<void> {
    await ESClient.index({
      index: EESIndexes.DIRECT_MESSAGES,
      id: messageId.toString(),
      document: message,
      refresh: 'wait_for',
    })
  }

  async createUser(userId: number, user: TUserESMapping): Promise<void> {
    await ESClient.index({
      index: EESIndexes.USERS,
      id: userId.toString(),
      document: user,
      refresh: 'wait_for',
    })
  }

  async deleteMessage(messageId: number): Promise<void> {
    await ESClient.delete({
      index: EESIndexes.DIRECT_MESSAGES,
      id: messageId.toString(),
    })
  }

  async deleteUser(userId: number): Promise<void> {
    await ESClient.delete({
      index: EESIndexes.USERS,
      id: userId.toString(),
    })
  }

  async searchMessages(
    keyword: string,
    userId: number,
    limit: number
  ): Promise<TESSearchGeneralResult<TMessageESMapping>[]> {
    const result = await ESClient.search<TMessageESMapping>({
      index: EESIndexes.DIRECT_MESSAGES,
      query: {
        bool: {
          must: [
            { match_phrase: { content: { query: keyword } } }, // Tìm kiếm full-text
            { term: { valid_user_ids: userId } }, // Lọc theo user_ids
          ],
        },
      },
      sort: [{ created_at: { order: 'desc' } }], // Sắp xếp theo created_at giảm dần
      size: limit, // Giới hạn kết quả theo tham số limit
      highlight: {
        fields: {
          content: {}, // Highlight keyword trong content
        },
      },
    })
    console.log('>>> search message result:', { result, keyword })
    return this.extractESHits(result)
  }

  async searchUsers(
    keyword: string,
    limit: number
  ): Promise<TESSearchGeneralResult<TUserESMapping>[]> {
    const result = await ESClient.search<TUserESMapping>({
      index: EESIndexes.USERS,
      query: {
        bool: {
          should: [
            { match: { email: { query: keyword, fuzziness: 'AUTO' } } },
            { match: { full_name: { query: keyword, fuzziness: 'AUTO' } } },
          ],
          minimum_should_match: 1,
        },
      },
      highlight: {
        fields: {
          email: {},
          full_name: {},
        },
      },
      sort: [{ 'full_name.for_sort': { order: 'asc' } }, { 'email.for_sort': { order: 'asc' } }],
      size: limit,
    })
    console.log('>>> search user result:', { result, keyword })
    return this.extractESHits(result)
  }
}

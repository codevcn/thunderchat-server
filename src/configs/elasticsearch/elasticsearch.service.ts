import { Injectable, OnModuleInit } from '@nestjs/common'
import { Client } from '@elastic/elasticsearch'
import type {
  TESSearchGeneralResult,
  TMessageESMapping,
  TUserESMapping,
} from './elasticsearch.type'
import { EESIndexes } from './elasticsearch.enum'
import type { SearchHit, SearchResponse } from '@elastic/elasticsearch/lib/api/types'
import type { TMessageSearchOffset, TUserSearchOffset } from '@/search/search.type'
import { DevLogger } from '@/dev/dev-logger'

export const ESClient = new Client({
  node: process.env.ELASTICSEARCH_URL,
  auth: { apiKey: process.env.ELASTIC_API_KEY },
})

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    ESClient.diagnostic.on('request', (err, event) => {
      if (err) DevLogger.logESQuery('ES Request Error:', err)
      else DevLogger.logESQuery('ES Request:', event?.meta?.request?.params)
    })
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
      index: EESIndexes.MESSAGES,
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
      index: EESIndexes.MESSAGES,
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
      index: EESIndexes.MESSAGES,
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
    limit: number,
    searchOffset?: TMessageSearchOffset
  ): Promise<TESSearchGeneralResult<TMessageESMapping>[]> {
    const result = await ESClient.search<TMessageESMapping>({
      index: EESIndexes.MESSAGES,
      query: {
        bool: {
          must: [
            { match_phrase: { content: { query: keyword } } },
            { term: { valid_user_ids: userId } },
          ],
        },
      },
      sort: [{ created_at: { order: 'desc' } }, { doc_id: { order: 'desc' } }],
      size: limit,
      ...(searchOffset ? { search_after: searchOffset } : {}),
      highlight: {
        fields: {
          content: {},
        },
      },
    })
    return this.extractESHits(result)
  }

  async searchUsers(
    keyword: string,
    limit: number,
    searchOffset?: TUserSearchOffset
  ): Promise<TESSearchGeneralResult<TUserESMapping>[]> {
    const result = await ESClient.search<TUserESMapping>({
      index: EESIndexes.USERS,
      query: {
        bool: {
          should: [
            { match_phrase: { email: { query: keyword } } },
            { match_phrase: { full_name: { query: keyword } } },
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
      sort: [
        { 'full_name.for_sort': { order: 'asc' } },
        { 'email.for_sort': { order: 'asc' } },
        { doc_id: { order: 'asc' } },
      ],
      size: limit,
      ...(searchOffset ? { search_after: searchOffset } : {}),
    })
    return this.extractESHits(result)
  }
}

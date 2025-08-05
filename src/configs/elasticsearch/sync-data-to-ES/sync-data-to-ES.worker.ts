import { PrismaClient } from '@prisma/client'
import {
  ConnectionException,
  UnknownException,
  WorkerInputDataException,
  WorkerResponseException,
} from '@/utils/exceptions/system.exception'
import type { TMessage } from '@/utils/entities/message.entity'
import type { TUserWithProfile } from '@/utils/entities/user.entity'
import type { TWorkerResponse } from '@/utils/types'
import { isMainThread, parentPort } from 'worker_threads'
import { SyncDataToESWorkerMessageDTO } from './sync-data-to-ES.dto'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { EMessageTypes } from '@/direct-message/direct-message.enum'
import { EMsgEncryptionAlgorithms, ESyncDataToESWorkerType } from '@/utils/enums'
import { Client } from '@elastic/elasticsearch'
import { EESIndexes } from '@/configs/elasticsearch/elasticsearch.enum'
import { ESyncDataToESMessages } from './sync-data-to-ES.message'
import { replaceHTMLTagInMessageContent, retryAsyncRequest, typeToRawObject } from '@/utils/helpers'
import UserMessageEncryptor from '@/direct-message/security/es-message-encryptor'
import type { TMessageESMapping, TUserESMapping } from '@/configs/elasticsearch/elasticsearch.type'
import { SymmetricEncryptor } from '@/utils/crypto/symmetric-encryption.crypto'
import { measureTime } from '@/dev/helpers'
import { NotFoundException } from '@nestjs/common'

type TCheckInputDataResult = {
  messageData: SyncDataToESWorkerMessageDTO
  prismaClient: PrismaClient
  syncDataToESHandler: SyncDataToESHandler
}

class SyncDataToESHandler {
  private readonly MAX_RETRIES: number = 3

  constructor(private ESClient: Client) {}

  recursiveCreateUpdateMessage = async (
    queryResult: TMessage,
    prismaClient: PrismaClient
  ): Promise<void> => {
    try {
      await retryAsyncRequest(
        async () => {
          let validUserIds: number[] = []
          const { directChatId, recipientId, groupChatId, authorId } = queryResult
          if (directChatId && recipientId) {
            validUserIds = [recipientId, authorId]
          } else if (groupChatId) {
            const groupChat = await prismaClient.groupChat.findUnique({
              where: { id: groupChatId },
              select: {
                Members: {
                  select: {
                    userId: true,
                  },
                },
              },
            })
            if (!groupChat) {
              throw new NotFoundException(ESyncDataToESMessages.GROUP_CHAT_NOT_FOUND)
            }
            validUserIds = groupChat.Members.map((member) => member.userId)
          }
          await this.ESClient.index({
            index: EESIndexes.DIRECT_MESSAGES,
            id: queryResult.id.toString(),
            document: typeToRawObject<TMessageESMapping>({
              doc_id: queryResult.id,
              content: replaceHTMLTagInMessageContent(queryResult.content),
              original_content: queryResult.content,
              message_type: queryResult.type as EMessageTypes,
              valid_user_ids: validUserIds,
              created_at: queryResult.createdAt.toISOString(),
            }),
          })
        },
        { maxRetries: this.MAX_RETRIES }
      )
    } catch (error) {
      throw new UnknownException(ESyncDataToESMessages.SYNC_MESSAGE_ERROR, error)
    }
  }

  recursiveCreateUpdateUser = async (queryResult: TUserWithProfile): Promise<void> => {
    try {
      await retryAsyncRequest(
        async () => {
          await this.ESClient.index({
            index: EESIndexes.USERS,
            id: queryResult.id.toString(),
            document: typeToRawObject<TUserESMapping>({
              doc_id: queryResult.id,
              email: queryResult.email,
              full_name: queryResult.Profile?.fullName || '',
            }),
          })
        },
        { maxRetries: this.MAX_RETRIES }
      )
    } catch (error) {
      throw new UnknownException(ESyncDataToESMessages.SYNC_USER_ERROR, error)
    }
  }

  recursiveSyncAllUsersAndMessages = async (prismaClient: PrismaClient): Promise<void> => {
    const messages = await prismaClient.message.findMany()
    const users = await prismaClient.user.findMany({
      include: {
        Profile: true,
      },
    })
    console.log('messages count: ', messages.length)
    console.log('users count: ', users.length)
    console.log('start sync messages')
    await Promise.all(
      messages.map(
        async ({
          directChatId,
          recipientId,
          groupChatId,
          authorId,
          content,
          type,
          createdAt,
          id,
        }) => {
          let validUserIds: number[] = []
          if (directChatId && recipientId) {
            validUserIds = [recipientId, authorId]
          } else if (groupChatId) {
            const groupChat = await prismaClient.groupChat.findUnique({
              where: { id: groupChatId },
              select: {
                Members: {
                  select: {
                    userId: true,
                  },
                },
              },
            })
            if (!groupChat) {
              throw new NotFoundException(ESyncDataToESMessages.GROUP_CHAT_NOT_FOUND)
            }
            validUserIds = groupChat.Members.map((member) => member.userId)
          }
          await this.ESClient.index({
            index: EESIndexes.DIRECT_MESSAGES,
            id: id.toString(),
            document: typeToRawObject<TMessageESMapping>({
              doc_id: id,
              content: replaceHTMLTagInMessageContent(content),
              original_content: content,
              valid_user_ids: validUserIds,
              message_type: type as EMessageTypes,
              created_at: createdAt.toISOString(),
            }),
          })
        }
      )
    )
    await Promise.all(
      users.map(async ({ id, email, Profile }) => {
        await this.ESClient.index({
          index: EESIndexes.USERS,
          id: id.toString(),
          document: typeToRawObject<TUserESMapping>({
            doc_id: id,
            full_name: Profile?.fullName || '',
            email: email,
          }),
        })
      })
    )
  }
}

const checkInputData = async (
  workerData: SyncDataToESWorkerMessageDTO
): Promise<TCheckInputDataResult> => {
  const workerDataInstance = plainToInstance(SyncDataToESWorkerMessageDTO, workerData)
  const errors = await validate(workerDataInstance)
  if (errors.length > 0) {
    throw new WorkerInputDataException(
      `Validation failed: ${errors.map((e) => Object.values(e.constraints || {})).join(', ')}`
    )
  }
  const ESClient = new Client({
    node: process.env.ELASTICSEARCH_URL,
    auth: { apiKey: process.env.ELASTIC_API_KEY },
    serverMode: 'serverless',
  })
  const prismaClient = new PrismaClient()
  try {
    const pingSuccess = await ESClient.ping()
    if (!pingSuccess) {
      throw new ConnectionException(ESyncDataToESMessages.ES_PING_ERROR)
    }
    await prismaClient.$connect()
  } catch (error) {
    throw new ConnectionException(ESyncDataToESMessages.SYNC_ES_CONNECTION_ERROR, error)
  }
  const syncDataToESHandler = new SyncDataToESHandler(ESClient)
  return {
    messageData: workerDataInstance,
    prismaClient,
    syncDataToESHandler,
  }
}

const createOrUpdateMessageMapping = async (
  rawMsgContent: string,
  prismaClient: PrismaClient,
  userId: number,
  currentRawMappings: string,
  userSecretKey: string
): Promise<void> => {
  let encryptedMsgContent: string
  const symmetricEncryptor = new SymmetricEncryptor(EMsgEncryptionAlgorithms.AES_256_ECB)
  if (currentRawMappings) {
    const newMappings = new Set(currentRawMappings + rawMsgContent)
    encryptedMsgContent = symmetricEncryptor.encrypt(
      Array.from(newMappings).join(''),
      userSecretKey
    )
  } else {
    encryptedMsgContent = symmetricEncryptor.encrypt(rawMsgContent, userSecretKey)
  }
  await prismaClient.messageMapping.update({
    where: {
      userId,
    },
    data: {
      mappings: encryptedMsgContent,
    },
  })
}

const encryptMessageContent = (
  rawMsgContent: string,
  msgEncryptor: UserMessageEncryptor
): string => {
  return msgEncryptor.encrypt(rawMsgContent)
}

const runWorker = async (workerData: SyncDataToESWorkerMessageDTO): Promise<void> => {
  console.log('launch worker 1: ', workerData)
  if (isMainThread) return
  console.log('launch worker 2')

  const { messageData, prismaClient, syncDataToESHandler } = await checkInputData(workerData)
  // const { type, data, msgEncryptor } = messageData
  const { type, data } = messageData

  // if (data && 'content' in data) {
  //   if (!msgEncryptor) {
  //     throw new WorkerInputDataException(ESyncDataToESMessages.SYNC_MESSAGE_ENCRYPTOR_NOT_FOUND)
  //   }
  //   const rawMsgContent = data.content
  //   await createOrUpdateMessageMapping(
  //     rawMsgContent,
  //     prismaClient,
  //     data.authorId,
  //     msgEncryptor.getMappings(),
  //     msgEncryptor.getSecretKey()
  //   )
  //   data.content = encryptMessageContent(rawMsgContent, msgEncryptor)
  // }

  switch (type) {
    case ESyncDataToESWorkerType.CREATE_MESSAGE:
      await syncDataToESHandler.recursiveCreateUpdateMessage(data as TMessage, prismaClient)
      break
    case ESyncDataToESWorkerType.UPDATE_MESSAGE:
      await syncDataToESHandler.recursiveCreateUpdateMessage(data as TMessage, prismaClient)
      break
    case ESyncDataToESWorkerType.CREATE_USER:
      await syncDataToESHandler.recursiveCreateUpdateUser(data as TUserWithProfile)
      break
    case ESyncDataToESWorkerType.UPDATE_USER:
      await syncDataToESHandler.recursiveCreateUpdateUser(data as TUserWithProfile)
      break
    case ESyncDataToESWorkerType.ALL_USERS_AND_MESSAGES:
      await syncDataToESHandler.recursiveSyncAllUsersAndMessages(prismaClient)
      break
  }

  parentPort?.postMessage(
    typeToRawObject<TWorkerResponse<null>>({
      success: true,
      data: null,
    })
  )
}

parentPort?.on('message', (message) => {
  runWorker(message).catch((error) => {
    console.error('>>> sync data to es worker error:', error)
    parentPort?.postMessage(
      typeToRawObject<TWorkerResponse<null>>({
        success: false,
        error: new WorkerResponseException(`Worker errors occured: ${error}`, error),
      })
    )
  })
})

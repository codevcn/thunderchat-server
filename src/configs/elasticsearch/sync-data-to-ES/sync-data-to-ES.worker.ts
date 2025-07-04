import { PrismaClient } from '@prisma/client'
import { BaseHttpException } from '@/utils/exceptions/base-http.exception'
import {
   ConnectionException,
   SystemException,
   UnknownException,
   WorkerInputDataException,
   WorkerResponseException,
} from '@/utils/exceptions/system.exception'
import type { TDirectMessage } from '@/utils/entities/direct-message.entity'
import type { TUser, TUserWithProfile } from '@/utils/entities/user.entity'
import type { TProfile } from '@/utils/entities/profile.entity'
import type { TDirectChat } from '@/utils/entities/direct-chat.entity'
import type { TSignatureObject, TWorkerResponse } from '@/utils/types'
import { isMainThread, parentPort } from 'worker_threads'
import { SyncDataToESWorkerMessageDTO } from './sync-data-to-ES.dto'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { EMessageStatus, EMessageTypes } from '@/direct-message/direct-message.enum'
import { EMsgEncryptionAlgorithms, ESyncDataToESWorkerType } from '@/utils/enums'
import { Client } from '@elastic/elasticsearch'
import { EESIndexes } from '@/configs/elasticsearch/elasticsearch.enum'
import { ESyncDataToESMessages } from './sync-data-to-ES.message'
import { retryRequest, typeToRawObject } from '@/utils/helpers'
import UserMessageEncryptor from '@/direct-message/security/es-message-encryptor'
import type {
   TDirectMessageMapping,
   TUserMapping,
} from '@/configs/elasticsearch/elasticsearch.type'
import { SymmetricEncryptor } from '@/utils/crypto/symmetric-encryption.crypto'

type TDirectChatWithRelations = TDirectChat & {
   Creator: TUserWithProfile
   Recipient: TUserWithProfile
}

type TCheckInputDataResult = {
   messageData: SyncDataToESWorkerMessageDTO
   prismaClient: PrismaClient
   syncDataToESHandler: SyncDataToESHandler
}

class SyncDataToESHandler {
   private readonly MAX_RETRIES: number = 3
   private readonly recursiveCounter: TSignatureObject = {}

   constructor(private ESClient: Client) {}

   recursiveCreateUpdateMessage = async (
      prismaClient: PrismaClient,
      queryResult: TDirectMessage
   ) => {
      let chat: TDirectChatWithRelations | null = null
      try {
         await retryRequest(
            async () => {
               if (!chat) {
                  chat = await prismaClient.directChat.findUnique({
                     where: {
                        id: queryResult.directChatId,
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
                     },
                  })
               }
               if (!chat) {
                  throw new BaseHttpException('Find direct chat failed')
               }
               await this.ESClient.index({
                  index: EESIndexes.DIRECT_MESSAGES,
                  id: queryResult.id.toString(),
                  document: typeToRawObject<TDirectMessageMapping>({
                     message_id: queryResult.id,
                     content: queryResult.content,
                     type: queryResult.type as EMessageTypes,
                     status: queryResult.status as EMessageStatus,
                     created_at: queryResult.createdAt as Date,
                     valid_user_ids: [chat.creatorId, chat.recipientId],
                     recipient: {
                        user_id: chat.recipientId,
                        email: chat.Recipient.email,
                        full_name: chat.Recipient.Profile?.fullName || '',
                        avatar: chat.Recipient.Profile?.avatar || '',
                     },
                     sender: {
                        user_id: chat.creatorId,
                        email: chat.Creator.email,
                        full_name: chat.Creator.Profile?.fullName || '',
                        avatar: chat.Creator.Profile?.avatar || '',
                     },
                  }),
               })
            },
            { maxRetries: this.MAX_RETRIES }
         )
      } catch (error) {
         throw new UnknownException(ESyncDataToESMessages.SYNC_MESSAGE_ERROR, error)
      }
   }

   recursiveCreateUpdateUser = async (prismaClient: PrismaClient, queryResult: TUser) => {
      let user: TUserWithProfile | null = null
      try {
         await retryRequest(
            async () => {
               if (!user) {
                  user = await prismaClient.user.findUnique({
                     where: {
                        id: queryResult.id,
                     },
                     include: {
                        Profile: true,
                     },
                  })
               }
               if (!user) {
                  throw new BaseHttpException('Find user failed')
               }
               await this.ESClient.index({
                  index: EESIndexes.USERS,
                  id: user.id.toString(),
                  document: typeToRawObject<TUserMapping>({
                     user_id: user.id,
                     email: user.email,
                     full_name: user.Profile?.fullName || '',
                     avatar: user.Profile?.avatar || '',
                  }),
               })
            },
            { maxRetries: this.MAX_RETRIES }
         )
      } catch (error) {
         throw new UnknownException(ESyncDataToESMessages.SYNC_USER_ERROR, error)
      }
   }

   recursiveCreateUpdateProfile = async (prismaClient: PrismaClient, queryResult: TProfile) => {
      const userId = queryResult.userId
      let user: TUser | null = null
      try {
         await retryRequest(async () => {
            if (!user) {
               user = await prismaClient.user.findUnique({
                  where: {
                     id: userId,
                  },
               })
            }
            if (!user) {
               throw new BaseHttpException('Find user failed')
            }
            await this.ESClient.index({
               index: EESIndexes.USERS,
               id: userId.toString(),
               document: typeToRawObject<TUserMapping>({
                  user_id: userId,
                  full_name: queryResult.fullName,
                  email: user.email,
                  avatar: queryResult.avatar || '',
               }),
            })
         })
      } catch (error) {
         throw new UnknownException(ESyncDataToESMessages.SYNC_PROFILE_ERROR, error)
      }
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
      cloud: { id: process.env.ELASTIC_CLOUD_ID },
      auth: { apiKey: process.env.ELASTIC_API_KEY },
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

const launchWorker = async (workerData: SyncDataToESWorkerMessageDTO) => {
   console.log('>>> launch worker 1')
   if (isMainThread) return
   console.log('>>> launch worker 2')

   const { messageData, prismaClient, syncDataToESHandler } = await checkInputData(workerData)
   const { type, data, msgEncryptor } = messageData

   if ('content' in data) {
      if (!msgEncryptor) {
         throw new WorkerInputDataException(ESyncDataToESMessages.SYNC_MESSAGE_ENCRYPTOR_NOT_FOUND)
      }
      const rawMsgContent = data.content
      await createOrUpdateMessageMapping(
         rawMsgContent,
         prismaClient,
         data.authorId,
         msgEncryptor.getMappings(),
         msgEncryptor.getSecretKey()
      )
      data.content = encryptMessageContent(rawMsgContent, msgEncryptor)
   }

   switch (type) {
      case ESyncDataToESWorkerType.CREATE_MESSAGE:
         await syncDataToESHandler.recursiveCreateUpdateMessage(
            prismaClient,
            data as TDirectMessage
         )
         break
      case ESyncDataToESWorkerType.UPDATE_MESSAGE:
         await syncDataToESHandler.recursiveCreateUpdateMessage(
            prismaClient,
            data as TDirectMessage
         )
         break
      case ESyncDataToESWorkerType.CREATE_USER:
         await syncDataToESHandler.recursiveCreateUpdateUser(prismaClient, data as TUser)
         break
      case ESyncDataToESWorkerType.UPDATE_USER:
         await syncDataToESHandler.recursiveCreateUpdateUser(prismaClient, data as TUser)
         break
      case ESyncDataToESWorkerType.CREATE_PROFILE:
         await syncDataToESHandler.recursiveCreateUpdateProfile(prismaClient, data as TProfile)
         break
      case ESyncDataToESWorkerType.UPDATE_PROFILE:
         await syncDataToESHandler.recursiveCreateUpdateProfile(prismaClient, data as TProfile)
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
   launchWorker(message).catch((error) => {
      parentPort?.postMessage(
         typeToRawObject<TWorkerResponse<null>>({
            success: false,
            error: new WorkerResponseException(`Worker errors occured: ${error}`, error),
         })
      )
   })
})

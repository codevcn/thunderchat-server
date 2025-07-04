import { Injectable, NotFoundException } from '@nestjs/common'
import { createWorker } from '@/utils/helpers'
import { SyncDataToESWorkerMessageDTO } from './sync-data-to-ES.dto'
import type {
   TWorkerErrorCallback,
   TWorkerExitCallback,
   TWorkerResponseCallback,
} from '@/utils/types'
import { Worker } from 'worker_threads'
import path from 'path'
import { TUserId } from '@/user/user.type'
import { ESyncDataToESMessages } from './sync-data-to-ES.message'
import { SymmetricEncryptor } from '@/utils/crypto/symmetric-encryption.crypto'
import ESMessageEncryptor from '@/direct-message/security/es-message-encryptor'
import { MessageMappingService } from '@/message-mapping/message-mapping.service'
import { EWorkerEvents, EMsgEncryptionAlgorithms } from '@/utils/enums'
import { SystemException } from '@/utils/exceptions/system.exception'
import { BaseHttpException } from '@/utils/exceptions/base-http.exception'

@Injectable()
export class SyncDataToESService {
   private readonly ESMsgEncryptors: Map<TUserId, ESMessageEncryptor> = new Map()
   private syncDataToESWorker: Worker

   constructor(private messageMappingService: MessageMappingService) {}

   initWorker() {
      this.syncDataToESWorker = createWorker(path.join(__dirname, 'sync-data-to-ES.worker.js'))
   }

   terminateWorker() {
      this.syncDataToESWorker.terminate()
   }

   onWorkerExit(callback: TWorkerExitCallback) {
      this.syncDataToESWorker.on(EWorkerEvents.EXIT, callback)
      this.terminateWorker()
   }

   onWorkerError(callback: TWorkerErrorCallback) {
      this.syncDataToESWorker.on(EWorkerEvents.ERROR, callback)
      this.terminateWorker()
   }

   onWorkerMessage(callback: TWorkerResponseCallback<SyncDataToESWorkerMessageDTO>) {
      this.syncDataToESWorker.on(EWorkerEvents.MESSAGE, callback)
      this.terminateWorker()
   }

   syncDataToES(userId: TUserId, data: SyncDataToESWorkerMessageDTO) {
      const ESMsgEncryptor = this.getESMessageEncryptor(userId)
      if (!ESMsgEncryptor) {
         throw new SystemException(ESyncDataToESMessages.MESSAGE_ENCRYPTOR_NOT_SET)
      }
      this.initWorker()
      this.syncDataToESWorker.postMessage({ ...data, msgEncryptor: ESMsgEncryptor })
   }

   async initESMessageEncryptor(userId: TUserId): Promise<void> {
      const messageMapping = await this.messageMappingService.findMessageMapping(userId)
      if (!messageMapping) {
         throw new BaseHttpException(ESyncDataToESMessages.MESSAGE_MAPPING_NOT_FOUND)
      }
      const masterKey = process.env.DECRYPT_USER_KEY_MASTER_KEY
      const symmetricEncryptor = new SymmetricEncryptor(EMsgEncryptionAlgorithms.AES_256_ECB)
      const { mappings, key } = messageMapping
      const decryptedSecretKey = symmetricEncryptor.decrypt(key, masterKey)
      const decryptedMappings = mappings ? symmetricEncryptor.decrypt(mappings, masterKey) : null
      const ESMsgEncryptor = new ESMessageEncryptor(decryptedSecretKey, decryptedMappings)
      this.ESMsgEncryptors.set(userId, ESMsgEncryptor)
   }

   getESMessageEncryptor(userId: TUserId): ESMessageEncryptor | undefined {
      return this.ESMsgEncryptors.get(userId)
   }

   getUserSecretKey(userId: TUserId): string | undefined {
      return this.ESMsgEncryptors.get(userId)?.getSecretKey()
   }
}

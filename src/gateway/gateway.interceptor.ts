import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { SymmetricEncryptor } from '@/utils/crypto/symmetric-encryption.crypto'
import { SyncDataToESService } from '@/configs/elasticsearch/sync-data-to-ES/sync-data-to-ES.service'
import { EClientSocketEvents } from './gateway.event'
import { EMessageTypes } from '@/direct-message/direct-message.enum'
import { BaseWsException } from '@/utils/exceptions/base-ws.exception'
import type { TClientSocket } from './gateway.type'
import { EGatewayMessages } from './gateway.message'
import { EMsgEncryptionAlgorithms } from '@/utils/enums'

@Injectable()
export class GatewayInterceptor implements NestInterceptor {
   private readonly msgEncryptor: SymmetricEncryptor

   constructor(private readonly syncDataToESService: SyncDataToESService) {
      this.msgEncryptor = new SymmetricEncryptor(EMsgEncryptionAlgorithms.AES_256_ECB)
   }

   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const client = context.switchToWs().getClient<TClientSocket>()
      const event = context.switchToWs().getPattern() as EClientSocketEvents
      const data = context.switchToWs().getData()

      this.handleEncryptMessageContent(client, event, data)

      return next.handle()
   }

   handleEncryptMessageContent(client: TClientSocket, event: EClientSocketEvents, data: any): void {
      // Chỉ xử lý sự kiện gửi tin nhắn 1-1
      if (event !== EClientSocketEvents.send_message_direct) return

      console.log('🔐 Gateway Interceptor - Nhận payload:', {
         type: data?.type,
         content: data?.msgPayload?.content,
         mediaUrl: data?.msgPayload?.mediaUrl,
         receiverId: data?.msgPayload?.receiverId
      })

      // Validate message type và content
      if (!data || typeof data !== 'object') {
         throw new BaseWsException(EGatewayMessages.INVALID_MESSAGE_FORMAT)
      }

      const { type, msgPayload } = data
      if (!type || !msgPayload || typeof msgPayload !== 'object') {
         throw new BaseWsException(EGatewayMessages.INVALID_MESSAGE_FORMAT)
      }

      // Chỉ mã hóa nếu là message text
      if (type === EMessageTypes.TEXT && msgPayload.content) {
         const userId = client.handshake.auth.userId
         if (!userId) {
            throw new BaseWsException(EGatewayMessages.UNAUTHORIZED)
         }

         // Lấy khóa mã hóa từ SyncDataToESService
         const secretKey = this.syncDataToESService.getUserSecretKey(userId)
         if (!secretKey) {
            throw new BaseWsException(EGatewayMessages.MESSAGE_ENCRYPTOR_NOT_SET)
         }

         // Mã hóa nội dung message
         try {
            msgPayload.content = this.msgEncryptor.encrypt(msgPayload.content, secretKey)
         } catch (error) {
            throw new BaseWsException(EGatewayMessages.MESSAGE_ENCRYPTION_FAILED)
         }
      }
   }
}

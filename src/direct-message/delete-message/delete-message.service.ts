import { Injectable, Inject } from '@nestjs/common'
import { PrismaService } from '@/configs/db/prisma.service'
import { SocketService } from '@/gateway/socket/socket.service'
import { EClientSocketEvents } from '@/gateway/gateway.event'
import { EProviderTokens } from '@/utils/enums'
import type { TDeleteMessageResult } from './delete-message.type'
import { EMessageTypes } from '@/direct-message/direct-message.enum'
import { UploadService } from '@/upload/upload.service'

@Injectable()
export class DeleteMessageService {
  constructor(
    @Inject(EProviderTokens.PRISMA_CLIENT) private prisma: PrismaService,
    private socketService: SocketService,
    private uploadService: UploadService
  ) {}

  async recallMessage(msgId: number, userId: number): Promise<TDeleteMessageResult> {
    const msg = await this.prisma.message.findUnique({
      where: { id: msgId },
      include: { Media: true },
    })
    if (!msg)
      return {
        success: false,
        message: 'Tin nhắn không tồn tại',
        data: null,
        errorCode: 'NOT_FOUND',
        errors: null,
      }
    if (msg.authorId !== userId)
      return {
        success: false,
        message: 'Bạn không có quyền xoá tin nhắn này',
        data: null,
        errorCode: 'FORBIDDEN',
        errors: null,
      }

    let updateData: any = { isDeleted: true, content: '' }
    // Nếu là media thì set các trường liên quan về null/rỗng và xoá file trên S3
    if (msg.type === EMessageTypes.MEDIA) {
      if (msg.Media) {
        try {
          await this.uploadService.deleteFileByUrl(msg.Media.url)
        } catch (err) {
          // log lỗi nhưng vẫn tiếp tục
          return {
            success: false,
            message: 'Xoá file trên S3 thất bại',
            data: null,
            errorCode: 'DELETE_FILE_ERROR',
            errors: err,
          }
        }
      }
      // Nếu là VIDEO, xoá thêm thumbnailUrl
      if (msg.type === EMessageTypes.MEDIA && msg.Media) {
        try {
          await this.uploadService.deleteFileByUrl(msg.Media.thumbnailUrl)
        } catch (err) {
          // log lỗi nhưng vẫn tiếp tục
          return {
            success: false,
            message: 'Xoá file trên S3 thất bại',
            data: null,
            errorCode: 'DELETE_FILE_ERROR',
            errors: err,
          }
        }
      }
      updateData = {
        ...updateData,
        mediaUrl: null,
        fileName: '',
        thumbnailUrl: null,
        stickerUrl: null,
      }
    }
    const updated = await this.prisma.message.update({
      where: { id: msgId },
      data: updateData,
    })
    this.socketService.emitToDirectChat(
      (updated.directChatId || updated.groupChatId)!,
      EClientSocketEvents.send_message_direct,
      updated
    )
    return {
      success: true,
      message: 'Thu hồi tin nhắn thành công',
      data: updated,
      errorCode: null,
      errors: null,
    }
  }
}

import { Injectable, BadRequestException, Inject } from '@nestjs/common'
import * as AWS from 'aws-sdk'
import { ThumbnailService } from './thumbnail.service'
import { Express } from 'express'
import type { TUploadResult } from './upload.type'
import { PrismaService } from '@/configs/db/prisma.service'
import { EProviderTokens } from '@/utils/enums'
import { detectFileType, formatBytes } from '@/utils/helpers'

@Injectable()
export class UploadService {
  private s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION,
  })
  // Định nghĩa các loại file được phép upload
  private allowedMimeTypes = {
    // Images
    'image/jpeg': 'image',
    'image/png': 'image',
    'image/gif': 'image',
    'image/webp': 'image',

    // Videos
    'video/mp4': 'video',
    'video/avi': 'video',
    'video/mov': 'video',
    'video/wmv': 'video',

    // Documents
    'application/pdf': 'document',
    'application/msword': 'document', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document', // .docx
    'application/vnd.ms-excel': 'document', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document', // .xlsx
    'application/vnd.ms-powerpoint': 'document', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'document', // .pptx
    'text/plain': 'document', // .txt

    // Audio
    'audio/mpeg': 'audio',
    'audio/mp3': 'audio',
    'audio/wav': 'audio',
    'audio/webm': 'audio',
  }

  constructor(
    private readonly thumbnailService: ThumbnailService,
    @Inject(EProviderTokens.PRISMA_CLIENT) private PrismaService: PrismaService
  ) {}

  async uploadFile(file: Express.Multer.File): Promise<TUploadResult> {
    if (!process.env.AWS_S3_BUCKET) {
      throw new Error('AWS_S3_BUCKET environment variable is not set')
    }

    // Kiểm tra loại file
    const fileType = this.allowedMimeTypes[file.mimetype]
    if (!fileType) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`)
    }

    // Kiểm tra kích thước file (giới hạn 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 50MB limit')
    }

    const fileKey = `${Date.now()}_${file.originalname}`
    let uploadedFileUrl: string | null = null

    try {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }

      const data = await this.s3.upload(params).promise()
      uploadedFileUrl = data.Location

      const messageMedia = await this.PrismaService.messageMedia.create({
        data: {
          url: data.Location,
          type: await detectFileType(file),
          fileName: file.originalname,
          fileSize: file.size,
          thumbnailUrl: '',
        },
      })

      const result: TUploadResult = {
        id: messageMedia.id,
        url: messageMedia.url,
        fileType: messageMedia.type,
        fileName: messageMedia.fileName,
        fileSize: formatBytes(messageMedia.fileSize),
      }

      // Bước 2: Nếu là video, tạo thumbnail
      if (fileType === 'video') {
        try {
          // Kiểm tra thumbnail đã tồn tại chưa
          const existingThumbnail = await this.thumbnailService.checkThumbnailExists(fileKey)
          if (existingThumbnail) {
            result.thumbnailUrl = existingThumbnail
          } else {
            const thumbnailUrl = await this.thumbnailService.generateVideoThumbnail(
              data.Location,
              fileKey
            )
            result.thumbnailUrl = thumbnailUrl
          }
        } catch (error) {
          // Rollback: Xóa file video đã upload
          await this.rollbackFileUpload(fileKey)
          throw new Error(`Failed to create thumbnail: ${error.message}`)
        }
      }

      return result
    } catch (error) {
      // Nếu có lỗi và file đã được upload, rollback
      if (uploadedFileUrl) {
        await this.rollbackFileUpload(fileKey)
      }
      throw error
    }
  }

  /**
   * Rollback: Xóa file đã upload lên S3
   */
  private async rollbackFileUpload(fileKey: string): Promise<void> {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey,
    }
    await this.s3.deleteObject(params).promise()
  }

  /**
   * Xoá file bất kỳ trên S3 theo url
   */
  public async deleteFileByUrl(fileUrl: string): Promise<void> {
    const objectKey = fileUrl.split('.amazonaws.com/')[1]
    if (!objectKey) throw new Error('Không tìm thấy object key trong url')
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: objectKey,
    }
    await this.s3.deleteObject(params).promise()
  }
}

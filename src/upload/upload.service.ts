import { Injectable, BadRequestException } from '@nestjs/common'
import * as AWS from 'aws-sdk'
import { ThumbnailService } from './thumbnail.service'

@Injectable()
export class UploadService {
  private s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION,
  })

  constructor(private readonly thumbnailService: ThumbnailService) {}

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

  async uploadFile(
    file: any
  ): Promise<{ url: string; fileType: string; fileName: string; thumbnailUrl?: string }> {
    console.log('🚀 Bắt đầu upload file:', file.originalname)
    console.log('📁 Loại file:', file.mimetype)
    console.log('📏 Kích thước:', (file.size / 1024 / 1024).toFixed(2), 'MB')

    if (!process.env.AWS_S3_BUCKET) {
      throw new Error('AWS_S3_BUCKET environment variable is not set')
    }

    // Kiểm tra loại file
    const fileType = this.allowedMimeTypes[file.mimetype]
    if (!fileType) {
      console.log('❌ Loại file không được phép:', file.mimetype)
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`)
    }

    console.log('✅ Loại file hợp lệ:', fileType)

    // Kiểm tra kích thước file (giới hạn 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      console.log('❌ File quá lớn:', (file.size / 1024 / 1024).toFixed(2), 'MB')
      throw new BadRequestException('File size exceeds 50MB limit')
    }

    console.log('✅ Kích thước file hợp lệ')

    const fileKey = `${Date.now()}_${file.originalname}`
    let uploadedFileUrl: string | null = null

    try {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }

      console.log('📤 Đang upload lên S3...')
      console.log('🪣 Bucket:', process.env.AWS_S3_BUCKET)
      console.log('🔑 Key:', params.Key)

      const data = await this.s3.upload(params).promise()
      uploadedFileUrl = data.Location

      console.log('🎉 Upload thành công!')
      console.log('🔗 URL:', data.Location)
      console.log('📄 Tên file:', file.originalname)
      console.log('🏷️ Loại:', fileType)

      const result: { url: string; fileType: string; fileName: string; thumbnailUrl?: string } = {
        url: data.Location,
        fileType: fileType,
        fileName: file.originalname,
      }

      // Bước 2: Nếu là video, tạo thumbnail
      if (fileType === 'video') {
        try {
          console.log('🎬 Kiểm tra thumbnail có sẵn không...')

          // Kiểm tra thumbnail đã tồn tại chưa
          const existingThumbnail = await this.thumbnailService.checkThumbnailExists(fileKey)
          if (existingThumbnail) {
            console.log('✅ Thumbnail đã tồn tại:', existingThumbnail)
            result.thumbnailUrl = existingThumbnail
          } else {
            console.log('🎬 Bắt đầu tạo thumbnail mới...')
            const thumbnailUrl = await this.thumbnailService.generateVideoThumbnail(
              data.Location,
              fileKey
            )
            result.thumbnailUrl = thumbnailUrl
            console.log('✅ Tạo thumbnail thành công:', thumbnailUrl)
          }
        } catch (error) {
          console.error('❌ Lỗi tạo thumbnail:', error.message)
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
    try {
      console.log('🔄 Bắt đầu rollback: Xóa file', fileKey)

      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileKey,
      }

      await this.s3.deleteObject(params).promise()
      console.log('✅ Rollback thành công: Đã xóa file', fileKey)
    } catch (rollbackError) {
      console.error('❌ Lỗi rollback:', rollbackError.message)
      // Không throw error vì đây là cleanup, không nên làm fail toàn bộ process
    }
  }
}

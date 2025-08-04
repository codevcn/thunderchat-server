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

  /**
   * Xoá file bất kỳ trên S3 theo url
   */
  public async deleteFileByUrl(fileUrl: string): Promise<void> {
    try {
      const objectKey = fileUrl.split('.amazonaws.com/')[1]
      if (!objectKey) throw new Error('Không tìm thấy object key trong url')
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: objectKey,
      }
      await this.s3.deleteObject(params).promise()
      console.log('✅ Đã xoá file trên S3:', objectKey)
    } catch (err: any) {
      console.error('❌ Lỗi xoá file trên S3:', err.message)
      // Không throw để không làm fail process chính
    }
  }

  /**
   * Upload report image to S3
   */
  async uploadReportImage(file: Express.Multer.File): Promise<{ url: string }> {
    // Use the existing uploadFile method but with custom fileKey
    const originalName = file.originalname
    const timestamp = Date.now()
    const fileKey = `report-image/${timestamp}_${originalName}`

    // Create a modified file object with custom key
    const modifiedFile = {
      ...file,
      originalname: fileKey, // Override originalname to use our custom key
    }

    const result = await this.uploadFile(modifiedFile)
    return { url: result.url }
  }

  /**
   * Upload report message media to S3
   */
  async uploadReportMessageMedia(
    filePath: string,
    messageId: number,
    contentType: string
  ): Promise<{ url: string }> {
    const fs = require('fs')
    const path = require('path')
    const fileBuffer = fs.readFileSync(filePath)

    // Extract file extension from file path
    const fileExtension =
      path.extname(filePath).substring(1) || this.getExtensionFromContentType(contentType)
    const fileKey = `report-message/${Date.now()}_message-${messageId}.${fileExtension}`

    // Get proper content type based on file extension
    const properContentType = this.getContentTypeFromExtension(fileExtension) || contentType

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: properContentType,
    }

    const data = await this.s3.upload(params).promise()
    console.log('✅ Uploaded report message media:', data.Location)

    return { url: data.Location }
  }

  /**
   * Download file from URL and upload to S3 as report message media
   */
  async uploadReportMessageFromUrl(
    fileUrl: string,
    messageId: number,
    contentType: string
  ): Promise<{ url: string }> {
    const https = require('https')
    const http = require('http')

    return new Promise((resolve, reject) => {
      const protocol = fileUrl.startsWith('https:') ? https : http

      protocol
        .get(fileUrl, (response: any) => {
          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download file: HTTP ${response.statusCode}`))
            return
          }

          const chunks: Buffer[] = []
          response.on('data', (chunk: Buffer) => {
            chunks.push(chunk)
          })

          response.on('end', async () => {
            try {
              const fileBuffer = Buffer.concat(chunks)

              // Extract file extension from URL
              const urlParts = fileUrl.split('?')[0] // Remove query parameters
              const fileName = urlParts.split('/').pop() || 'file'
              const fileExtension = fileName.includes('.')
                ? fileName.split('.').pop() || this.getExtensionFromContentType(contentType)
                : this.getExtensionFromContentType(contentType)

              const fileKey = `report-message/${Date.now()}_message-${messageId}.${fileExtension}`

              // Get proper content type based on file extension
              const properContentType =
                this.getContentTypeFromExtension(fileExtension) || contentType

              const params = {
                Bucket: process.env.AWS_S3_BUCKET,
                Key: fileKey,
                Body: fileBuffer,
                ContentType: properContentType,
              }

              const data = await this.s3.upload(params).promise()
              console.log(
                '✅ Downloaded and uploaded report message media from URL:',
                data.Location
              )

              resolve({ url: data.Location })
            } catch (error) {
              reject(error)
            }
          })

          response.on('error', (error: any) => {
            reject(new Error(`Failed to download file: ${error.message}`))
          })
        })
        .on('error', (error: any) => {
          reject(new Error(`Failed to connect to URL: ${error.message}`))
        })
    })
  }

  /**
   * Get file extension from content type
   */
  private getExtensionFromContentType(contentType: string): string {
    // Map content types to extensions based on allowedMimeTypes
    const contentTypeToExtension: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/avi': 'avi',
      'video/mov': 'mov',
      'video/wmv': 'wmv',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/webm': 'webm',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'text/plain': 'txt',
    }

    // Check if content type is in allowedMimeTypes
    if (this.allowedMimeTypes[contentType]) {
      return contentTypeToExtension[contentType] || 'bin'
    }

    return 'bin'
  }

  /**
   * Get content type from file extension
   */
  private getContentTypeFromExtension(extension: string): string {
    // Map extensions to content types based on allowedMimeTypes
    const extensionToContentType: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      mp4: 'video/mp4',
      avi: 'video/avi',
      mov: 'video/mov',
      wmv: 'video/wmv',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      webm: 'audio/webm',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
    }

    const contentType = extensionToContentType[extension.toLowerCase()]

    // Verify that the content type is in allowedMimeTypes
    if (contentType && this.allowedMimeTypes[contentType]) {
      return contentType
    }

    return 'application/octet-stream'
  }
}

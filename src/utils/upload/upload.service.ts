import { Injectable, BadRequestException } from '@nestjs/common'
import * as AWS from 'aws-sdk'

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
   }

   async uploadFile(file: any): Promise<{ url: string; fileType: string; fileName: string }> {
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

      const params = {
         Bucket: process.env.AWS_S3_BUCKET,
         Key: `${Date.now()}_${file.originalname}`,
         Body: file.buffer,
         ContentType: file.mimetype,
      }

      console.log('📤 Đang upload lên S3...')
      console.log('🪣 Bucket:', process.env.AWS_S3_BUCKET)
      console.log('🔑 Key:', params.Key)

      const data = await this.s3.upload(params).promise()

      console.log('🎉 Upload thành công!')
      console.log('🔗 URL:', data.Location)
      console.log('📄 Tên file:', file.originalname)
      console.log('🏷️ Loại:', fileType)

      return {
         url: data.Location,
         fileType: fileType,
         fileName: file.originalname
      }
   }
}
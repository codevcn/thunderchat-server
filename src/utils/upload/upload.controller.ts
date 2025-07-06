import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { UploadService } from './upload.service'
import { Express } from 'express'

@Controller('upload')
export class UploadController {
   constructor(private readonly uploadService: UploadService) { }

   @Post()
   @UseInterceptors(FileInterceptor('file'))
   async uploadFile(@UploadedFile() file: Express.Multer.File) {
      console.log('📥 Upload Controller - Nhận file:', file.originalname)

      const result = await this.uploadService.uploadFile(file)

      console.log('📤 Upload Controller - Trả về kết quả:', {
         url: result.url,
         fileType: result.fileType,
         fileName: result.fileName
      })

      return {
         url: result.url,
         fileType: result.fileType,
         fileName: result.fileName
      }
   }
}
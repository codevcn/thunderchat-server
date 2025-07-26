import { Module } from '@nestjs/common'
import { UploadService } from './upload.service'
import { UploadController } from './upload.controller'
import { ThumbnailService } from './thumbnail.service'

@Module({
  controllers: [UploadController],
  providers: [UploadService, ThumbnailService],
  exports: [UploadService, ThumbnailService],
})
export class UploadModule {}

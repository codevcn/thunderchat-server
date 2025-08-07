import { Injectable, Logger } from '@nestjs/common'
import * as AWS from 'aws-sdk'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

@Injectable()
export class ThumbnailService {
  private readonly logger = new Logger(ThumbnailService.name)
  private readonly s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION,
  })

  /**
   * Tạo thumbnail cho video và upload lên S3
   */
  async generateVideoThumbnail(videoUrl: string, videoKey: string): Promise<string> {
    const thumbnailKey = this.generateThumbnailKey(videoKey)
    const tempVideoPath = path.join(os.tmpdir(), `temp_video_${Date.now()}.mp4`)
    const tempThumbnailPath = path.join(os.tmpdir(), `thumbnail_${Date.now()}.jpg`)
    let thumbnailUploaded = false

    try {
      this.logger.log(`Bắt đầu tạo thumbnail cho video: ${videoKey}`)

      // Bước 1: Download video từ S3 về temp
      await this.downloadVideoFromS3(videoUrl, tempVideoPath)

      // Bước 2: Tạo thumbnail bằng ffmpeg
      await this.createThumbnailWithFfmpeg(tempVideoPath, tempThumbnailPath)

      // Bước 3: Upload thumbnail lên S3
      const thumbnailUrl = await this.uploadThumbnailToS3(tempThumbnailPath, thumbnailKey)
      thumbnailUploaded = true

      // Bước 4: Cleanup temp files
      this.cleanupTempFiles([tempVideoPath, tempThumbnailPath])

      this.logger.log(`Tạo thumbnail thành công: ${thumbnailUrl}`)
      return thumbnailUrl
    } catch (error) {
      this.logger.error(`Lỗi tạo thumbnail: ${error.message}`)

      // Rollback: Nếu thumbnail đã upload nhưng có lỗi sau đó, xóa thumbnail
      if (thumbnailUploaded) {
        await this.rollbackThumbnailUpload(thumbnailKey)
      }

      // Cleanup temp files nếu có
      this.cleanupTempFiles([tempVideoPath, tempThumbnailPath])

      throw error
    }
  }

  /**
   * Download video từ S3 về local temp
   */
  private async downloadVideoFromS3(videoUrl: string, localPath: string): Promise<void> {
    try {
      const response = await fetch(videoUrl)
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`)
      }

      const buffer = await response.arrayBuffer()
      fs.writeFileSync(localPath, Buffer.from(buffer))
      this.logger.log(`Download video thành công: ${localPath}`)
    } catch (error) {
      this.logger.error(`Lỗi download video: ${error.message}`)
      throw error
    }
  }

  /**
   * Tạo thumbnail bằng ffmpeg
   */
  private async createThumbnailWithFfmpeg(videoPath: string, thumbnailPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Set ffmpeg path từ installer
      ffmpeg.setFfmpegPath(ffmpegInstaller.path)

      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['00:00:01'], // Lấy frame ở giây thứ 1
          filename: path.basename(thumbnailPath),
          folder: path.dirname(thumbnailPath),
          // Chỉ set width, height tự động giữ nguyên aspect ratio
          size: '320x?', // Width 320px, height tự động tính
        })
        .on('end', () => {
          this.logger.log(`Tạo thumbnail thành công: ${thumbnailPath}`)
          resolve()
        })
        .on('error', (error) => {
          this.logger.error(`Lỗi ffmpeg: ${error.message}`)
          reject(error)
        })
    })
  }

  /**
   * Upload thumbnail lên S3
   */
  private async uploadThumbnailToS3(thumbnailPath: string, thumbnailKey: string): Promise<string> {
    try {
      const fileBuffer = fs.readFileSync(thumbnailPath)

      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `thumbnail/${thumbnailKey}`,
        Body: fileBuffer,
        ContentType: 'image/jpeg',
      }

      const result = await this.s3.upload(params).promise()
      this.logger.log(`Upload thumbnail thành công: ${result.Location}`)
      return result.Location
    } catch (error) {
      this.logger.error(`Lỗi upload thumbnail: ${error.message}`)
      throw error
    }
  }

  /**
   * Tạo key cho thumbnail
   */
  private generateThumbnailKey(videoKey: string): string {
    const videoName = path.basename(videoKey, path.extname(videoKey))
    return `${videoName}_thumb.jpg`
  }

  /**
   * Cleanup temp files
   */
  private cleanupTempFiles(filePaths: string[]): void {
    filePaths.forEach((filePath) => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
          this.logger.log(`Đã xóa temp file: ${filePath}`)
        }
      } catch (error) {
        this.logger.warn(`Không thể xóa temp file ${filePath}: ${error.message}`)
      }
    })
  }

  /**
   * Rollback: Xóa thumbnail đã upload lên S3
   */
  private async rollbackThumbnailUpload(thumbnailKey: string): Promise<void> {
    try {
      this.logger.log(`🔄 Bắt đầu rollback thumbnail: Xóa file ${thumbnailKey}`)

      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `thumbnail/${thumbnailKey}`,
      }

      await this.s3.deleteObject(params).promise()
      this.logger.log(`✅ Rollback thumbnail thành công: Đã xóa file ${thumbnailKey}`)
    } catch (rollbackError) {
      this.logger.error(`❌ Lỗi rollback thumbnail: ${rollbackError.message}`)
      // Không throw error vì đây là cleanup, không nên làm fail toàn bộ process
    }
  }

  /**
   * Kiểm tra thumbnail đã tồn tại chưa
   */
  async checkThumbnailExists(videoKey: string): Promise<string | null> {
    try {
      const thumbnailKey = this.generateThumbnailKey(videoKey)

      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `thumbnail/${thumbnailKey}`,
      }

      await this.s3.headObject(params).promise()
      return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/thumbnail/${thumbnailKey}`
    } catch (error) {
      return null // Thumbnail chưa tồn tại
    }
  }
}

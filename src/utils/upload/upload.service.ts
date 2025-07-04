import { Injectable } from '@nestjs/common'
import * as AWS from 'aws-sdk'

@Injectable()
export class UploadService {
   private s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
      region: process.env.AWS_REGION,
   })

   async uploadFile(file: Express.Multer.File): Promise<string> {
      console.log('AWS_ACCESS_KEY:', process.env.AWS_ACCESS_KEY);
      console.log('AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET);
      console.log('AWS_REGION:', process.env.AWS_REGION);

      if (!process.env.AWS_S3_BUCKET) {
         throw new Error('AWS_S3_BUCKET environment variable is not set')
      }

      const params = {
         Bucket: process.env.AWS_S3_BUCKET,
         Key: `${Date.now()}_${file.originalname}`,
         Body: file.buffer,
         ContentType: file.mimetype,
      }
      const data = await this.s3.upload(params).promise()
      console.log({ type: params.ContentType, content: params.Body, mediaUrl: data.Location });
      return data.Location // URL file
   }
}
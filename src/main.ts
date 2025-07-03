import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { NestExpressApplication } from '@nestjs/platform-express'
import { ValidationPipe } from '@nestjs/common'
import { BaseHttpExceptionFilter } from './utils/exception-filters/base-http-exception.filter'
import cookieParser from 'cookie-parser'

const apiPrefix: string = 'api'

async function bootstrap() {
   const app = await NestFactory.create<NestExpressApplication>(AppModule)
   const { CLIENT_HOST_DEV, PORT } = process.env

   // set api prefix
   app.setGlobalPrefix(apiPrefix)

   // for getting cookie in req
   app.use(cookieParser())

   // cors
   app.enableCors({
      origin: [CLIENT_HOST_DEV],
      credentials: true,
   })

   // global exception filter
   app.useGlobalFilters(new BaseHttpExceptionFilter())

   // to be able to use dtos in controllers
   app.useGlobalPipes(new ValidationPipe({ transform: true }))

   await app.listen(PORT || 8080)
   console.log('>>> Server is working on PORT', PORT)
}

bootstrap()

import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { ValidationPipe } from '@nestjs/common'
import { BaseHttpExceptionFilter } from './utils/exception-filters/base-http-exception.filter'
import cookieParser from 'cookie-parser'
import { clearLogFiles } from './dev/helpers'
import { copyProtos } from './bootstrap/copy-protos-folder'
import { join } from 'path'

const beforeLaunch = async () => {
  await clearLogFiles()
  await copyProtos(
    join(__dirname, '/../../protos/artifacts/'),
    join(__dirname, '/../protos/artifacts/')
  )
}

const getAppModule = async () => {
  const { AppModule } = await import('./app.module')
  return AppModule
}

async function bootstrap() {
  await beforeLaunch()
  console.log('>>> Microservice [Conversation-Service] is launching...')

  const AppModule = await getAppModule()
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const { PORT, NODE_ENV } = process.env
  const CLIENT_HOST =
    NODE_ENV === 'production' ? process.env.CLIENT_HOST : process.env.CLIENT_HOST_DEV

  // set api prefix
  const apiPrefix: string = 'api'

  app.setGlobalPrefix(apiPrefix)

  // for getting cookie in req
  app.use(cookieParser())

  // cors
  app.enableCors({
    origin: [CLIENT_HOST, 'http://localhost:3000'],
    credentials: true,
  })

  // global exception filter
  app.useGlobalFilters(new BaseHttpExceptionFilter())

  // to be able to use dtos in controllers
  app.useGlobalPipes(new ValidationPipe({ transform: true }))

  await app.listen(PORT || 8080, '0.0.0.0')
  console.log('>>> Server is working on PORT', PORT)
}

bootstrap()

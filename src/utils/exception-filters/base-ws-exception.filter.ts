import { BaseWsException } from '@/utils/exceptions/base-ws.exception'
import { Catch, ArgumentsHost, HttpStatus } from '@nestjs/common'
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets'
import type { TClientSocket } from '@/gateway/gateway.type'
import { EClientSocketEvents } from '@/gateway/gateway.event'
import type { TWsErrorResponse } from '../types'
import { DevLogger } from '@/dev/dev-logger'
import { Prisma } from '@prisma/client'

@Catch(WsException)
export class BaseWsExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception: WsException, host: ArgumentsHost) {
    DevLogger.logError('ws exception:', exception)
    const clientSocket = host.switchToWs().getClient<TClientSocket>()
    const formattedException = this.formatException(exception)
    clientSocket.emit(EClientSocketEvents.error, formattedException)
    super.catch(exception, host)
  }

  private formatException(exception: WsException): TWsErrorResponse {
    const toReturn: TWsErrorResponse = {
      message: exception.message,
      httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      isError: true,
    }
    if (exception instanceof BaseWsException) {
      toReturn.httpStatus = exception.status
    }
    return toReturn
  }
}

function handleSetErrorMessage(error: Prisma.PrismaClientKnownRequestError | Error): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint failed
        const target = (error.meta?.target as string[])?.join(', ')
        return `Giá trị đã tồn tại cho trường: ${target}`
      default:
        return `Lỗi cơ sở dữ liệu (code: ${error.code})`
    }
  } else if (error instanceof Error) {
    return error.message
  }
  return 'Unknown error'
}

// catch socket exceptions at methods level
export function CatchInternalSocketError() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    descriptor.value = async function (...args: any[]): Promise<TWsErrorResponse> {
      try {
        // call original function
        return await originalMethod.apply(this, args)
      } catch (error) {
        DevLogger.logError('Caught WS error:', error)

        let clientMessage = handleSetErrorMessage(error)
        let httpStatus = error.status || 500

        return {
          isError: true,
          message: clientMessage,
          httpStatus,
        }
      }
    }
    return descriptor
  }
}

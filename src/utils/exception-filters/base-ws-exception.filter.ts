import { BaseWsException } from '@/utils/exceptions/base-ws.exception'
import { Catch, ArgumentsHost, HttpStatus } from '@nestjs/common'
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets'
import type { TClientSocket } from '@/gateway/gateway.type'
import { EClientSocketEvents } from '@/gateway/gateway.event'
import type { TWsErrorResponse } from '../types'

@Catch(WsException)
export class BaseWsExceptionsFilter extends BaseWsExceptionFilter {
   catch(exception: WsException, host: ArgumentsHost) {
      console.error('>>> ws exception:', exception)
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

// catch socket exceptions at methods level
export function CatchInternalSocketError() {
   return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value
      descriptor.value = async function (...args: any[]): Promise<TWsErrorResponse> {
         try {
            // call original function
            return await originalMethod.apply(this, args)
         } catch (error) {
            console.error('>>> catched ws error:', error)
            // return error data to client
            return {
               isError: true,
               message: error.message || 'Unknow Error',
               httpStatus: error.status,
            }
         }
      }
      return descriptor
   }
}

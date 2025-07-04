import { UnknownException } from '@/utils/exceptions/system.exception'
import { Injectable } from '@nestjs/common'

@Injectable()
export class LoggerService {
   log(message: string): void {
      console.log('>>> message:', message)
   }

   error(error: UnknownException): void {
      console.error('>>> error:', error.message)
   }

   warn(message: string): void {
      console.warn('>>> warn:', message)
   }
}

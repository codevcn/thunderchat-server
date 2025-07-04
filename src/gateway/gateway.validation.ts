import { ValidationError, ValidationPipe } from '@nestjs/common'
import { BaseWsException } from '../utils/exceptions/base-ws.exception'
import { EValidationMessages } from '@/utils/messages'

export const wsValidationPipe = new ValidationPipe({
   transform: true,
   exceptionFactory: (errors: ValidationError[]) => {
      console.error('>>> DTO validation errors:', errors)
      return new BaseWsException(EValidationMessages.INVALID_INPUT)
   },
})

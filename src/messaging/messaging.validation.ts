import { ValidationError, ValidationPipe } from '@nestjs/common'
import { BaseWsException } from '../utils/exceptions/base-ws.exception'
import { EValidationMessages } from '@/utils/messages'
import { DevLogger } from '@/dev/dev-logger'

export const wsValidationPipe = new ValidationPipe({
  transform: true,
  exceptionFactory: (errors: ValidationError[]) => {
    DevLogger.logError('DTO validation errors:', errors)
    return new BaseWsException(EValidationMessages.INVALID_INPUT)
  },
})

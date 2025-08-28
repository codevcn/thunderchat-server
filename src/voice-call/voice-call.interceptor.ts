import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { EVoiceCallListenSocketEvents } from '../utils/events/socket.event'
import type { TClientSocket } from '@/utils/events/event.type'
import { DevLogger } from '@/dev/dev-logger'

@Injectable()
export class VoiceCallGatewayInterceptor implements NestInterceptor {
  constructor() {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const client = context.switchToWs().getClient<TClientSocket>()
    const event = context.switchToWs().getPattern() as EVoiceCallListenSocketEvents
    const data = context.switchToWs().getData()

    DevLogger.logForWebsocket('Got an EVENT:', { event, data })

    return next.handle()
  }
}

import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
   use(req: Request, res: Response, next: NextFunction) {
      setTimeout(() => {
         console.log('\n>>> Coming Request:')
         console.log(`+) ${req.method} ${req.url}`)
         console.log('+) Headers:', req.headers)
         console.log('+) Params:', req.params)
         console.log('+) Query:', req.query)
         console.log('+) Body:', req.body, '\n')
      }, 0)
      next()
   }
}

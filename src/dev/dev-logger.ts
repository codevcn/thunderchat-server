import { Request } from 'express'
import { appendFile, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export class DevLogger {
  private static logDir: string = join(process.cwd(), 'logs')
  private static infoLogFile: string = join(this.logDir, 'info.log')
  private static incomingRequestsLogFile: string = join(this.logDir, 'incoming-requests.log')
  private static errorsLogFile: string = join(this.logDir, 'errors.log')
  private static sqlQueriesLogFile: string = join(this.logDir, 'sql-queries.log')
  private static websocketLogFile: string = join(this.logDir, 'websocket.log')

  static logInfo(...messages: (string | object | number)[]) {
    queueMicrotask(() => {
      if (!existsSync(this.logDir)) {
        mkdirSync(this.logDir, { recursive: true })
      }

      // Ghi mỗi message trên 1 dòng, nếu là object thì log theo format object
      const logMessage =
        '>>> ' +
        messages
          .map((msg) => {
            if (typeof msg === 'object') {
              try {
                return JSON.stringify(msg, null, 2)
              } catch (e) {
                return '[Object cannot be stringified]'
              }
            }
            return msg
          })
          .join('\n') +
        '\n'

      appendFile(this.infoLogFile, logMessage, { encoding: 'utf8' }, (err) => {
        if (err) {
          console.error('>>> Error writing to log file:', err)
        } else {
          console.log(`>>> [${new Date().toISOString()}]: Log file written successfully`)
        }
      })
    })
  }

  static logIncomingRequest(req: Request) {
    queueMicrotask(() => {
      const logMessage = `Coming Request: ${req.method} ${req.url}
         '+) Headers:' + JSON.stringify(req.headers)
         '+) Params:' + JSON.stringify(req.params)
         '+) Query:' + JSON.stringify(req.query)
         '+) Body:' + JSON.stringify(req.body)`

      if (!existsSync(this.logDir)) {
        mkdirSync(this.logDir, { recursive: true })
      }

      appendFile(this.incomingRequestsLogFile, logMessage, { encoding: 'utf8' }, (err) => {
        if (err) {
          console.error('>>> Error writing to log file:', err)
        } else {
          console.log(`>>> [${new Date().toISOString()}]: Log file written successfully`)
        }
      })
    })
  }

  static logError(...messages: (string | object | number)[]) {
    queueMicrotask(() => {
      if (!existsSync(this.logDir)) {
        mkdirSync(this.logDir, { recursive: true })
      }

      // Ghi mỗi message trên 1 dòng, nếu là object thì log theo format object
      const logMessage =
        '>>> ' +
        messages
          .map((msg) => {
            if (msg instanceof Error) {
              try {
                return `Error:\nname: ${msg.name}\nmessage: ${msg.message}\nstack: ${msg.stack
                  ?.split('\n')
                  .map((line) => `    ${line}`)
                  .join('\n')}`
              } catch (e) {
                return '[Object cannot be stringified]'
              }
            } else if (typeof msg === 'object') {
              try {
                return JSON.stringify(msg, null, 2)
              } catch (e) {
                return '[Object cannot be stringified]'
              }
            }
            return msg
          })
          .join('\n') +
        '\n'

      appendFile(this.errorsLogFile, logMessage, { encoding: 'utf8' }, (err) => {
        if (err) {
          console.error('>>> Error writing to log file:', err)
        } else {
          console.log(`>>> [${new Date().toISOString()}]: Log file written successfully`)
        }
      })
    })
  }

  static logSQLQuery(queryStatement: string, params: any, duration: number) {
    queueMicrotask(() => {
      const logMessage = `>>> SQL Query: ${queryStatement}
         '+) Params:' + JSON.stringify(params)
         '+) Duration:' + duration + 'ms'`

      if (!existsSync(this.logDir)) {
        mkdirSync(this.logDir, { recursive: true })
      }

      appendFile(this.sqlQueriesLogFile, logMessage, { encoding: 'utf8' }, (err) => {
        if (err) {
          console.error('>>> Error writing to log file:', err)
        }
      })
    })
  }

  static logForWebsocket(...messages: (string | object)[]) {
    queueMicrotask(() => {
      if (!existsSync(this.logDir)) {
        mkdirSync(this.logDir, { recursive: true })
      }

      // Ghi mỗi message trên 1 dòng, nếu là object thì log theo format object
      const logMessage =
        '>>> ' +
        messages
          .map((msg) => {
            if (typeof msg === 'object') {
              try {
                return JSON.stringify(msg, null, 2)
              } catch (e) {
                return '[Object cannot be stringified]'
              }
            }
            return msg
          })
          .join('\n') +
        '\n'

      appendFile(this.websocketLogFile, logMessage, { encoding: 'utf8' }, (err) => {
        if (err) {
          console.error('>>> Error writing to log file:', err)
        } else {
          console.log(`>>> [${new Date().toISOString()}]: Log file written successfully`)
        }
      })
    })
  }
}

import type { Request } from 'express'
import type { EClientCookieNames } from './enums'
import type { TUser } from './entities/user.entity'
import type { HttpStatus } from '@nestjs/common'

export type TRequestWithUser = Request & { user: TUser }

export type THttpErrorResBody = {
   name: string
   message: string
   timestamp: Date
   isUserError: boolean
}

export type TJWTToken = {
   jwt_token: string
}

export type TClientCookie = Record<EClientCookieNames, string>

export type TSuccess = {
   success: boolean // always true
}

export type TSignatureObject = {
   [key: string | number]: any
}

export type TDiscriminatedQueryReturn<S, I, O> = { select?: S } | { include?: I } | { omit?: O }

export type TWsErrorResponse = {
   isError: boolean
   message: string
   httpStatus: HttpStatus
}

export type TWorkerResponse<R> = {
   success: boolean
   error?: Error
   data?: R
}

export type TWorkerResponseCallback<T> = (event: MessageEvent<T>) => void

export type TWorkerExitCallback = (code: number) => void

export type TWorkerErrorCallback = (error: Error) => void

export type TRetryRequestOptions = {
   maxRetries: number
   onPreRetry?: TOnPreRetry
}

export type TOnPreRetry = (error: Error, retriesCount: number) => void

export type TRetryRequestExecutor<R> = () => R

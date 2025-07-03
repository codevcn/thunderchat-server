import crypto from 'crypto'
import path from 'path'
import { Worker } from 'worker_threads'
import type { TOnPreRetry, TRetryRequestExecutor, TRetryRequestOptions } from './types'

/**
 * Mã hóa tên file, đầu ra có độ dài tối đa 64 ký tự
 * @param {string} originalFilename - Tên file gốc
 * @param {number} length - Độ dài của mã băm
 * @returns {string} Tên file đã mã hóa, bao gồm UUID và mã băm
 */
export function encodeFilename(originalFilename: string, length: number): string {
   // Lấy phần mở rộng của file
   const ext = path.extname(encodeURIComponent(originalFilename))

   // Tạo hash SHA-256 từ tên file gốc
   const hash = crypto.createHash('sha256').update(originalFilename).digest('hex').slice(0, length)

   // Kết hợp UUID và hash để tạo tên file duy nhất
   const uniqueId = crypto.randomBytes(16).toString('hex')

   return `${uniqueId}-${hash}${ext}`
}

/**
 * Hàm này dùng để ép kiểu một đối tượng về một kiểu cụ thể trong TypeScript.
 * @param rawObject - Đối tượng cần ép kiểu
 * @template T - Kiểu của đối tượng
 * @returns Đối tượng đã được ép kiểu
 */
export function typeToRawObject<T>(rawObject: T): T {
   return rawObject
}

/**
 * Tạo một worker mới
 * @param {string} workerPath - Đường dẫn đến file worker
 * @returns {Worker} Một worker mới
 */
export function createWorker(workerPath: string): Worker {
   return new Worker(workerPath)
}

/**
 * Hàm này dùng để thực hiện yêu cầu lại nhiều lần nếu có lỗi
 * @param {TRetryRequestExecutor<R>} requestExecutor - Hàm thực hiện yêu cầu
 * @param {TRetryRequestOptions} options - Các tùy chọn cho việc thực hiện yêu cầu lại
 * @returns {R} Kết quả của yêu cầu
 */
export function retryRequest<R>(
   requestExecutor: TRetryRequestExecutor<R>,
   options?: TRetryRequestOptions
): R {
   let retriesCount = 0
   function retryHandler(): R {
      let maxRetries: number | undefined = undefined
      let onPreRetry: TOnPreRetry | undefined = undefined
      if (options) {
         maxRetries = options.maxRetries
         onPreRetry = options.onPreRetry
      }
      try {
         return requestExecutor()
      } catch (error) {
         if (maxRetries && retriesCount <= maxRetries) {
            if (onPreRetry) {
               onPreRetry(error, retriesCount)
            }
            retriesCount++
            return retryHandler()
         } else {
            throw error
         }
      }
   }
   return retryHandler()
}

import crypto from 'crypto'
import path from 'path'
import { Worker } from 'worker_threads'
import type { TOnPreRetry, TRetryRequestExecutor, TRetryRequestOptions } from './types'
import validator from 'validator'

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
export async function retryAsyncRequest<R>(
  requestExecutor: () => Promise<R>,
  options?: TRetryRequestOptions
): Promise<R> {
  const { maxRetries = 3, onPreRetry } = options || {}
  let retriesCount = 0
  async function retryHandler(): Promise<R> {
    try {
      return await requestExecutor()
    } catch (error) {
      if (retriesCount < maxRetries) {
        if (onPreRetry) onPreRetry(error, retriesCount)
        retriesCount++
        return await retryHandler()
      } else {
        throw error
      }
    }
  }
  return await retryHandler()
}

export const checkIsEmail = (text: string): boolean => {
  return validator.isEmail(text)
}

/**
 * Kiểm tra xem chuỗi input có chứa thẻ HTML hay không
 * @param {string} input - Chuỗi cần kiểm tra
 * @returns {string} Chuỗi đã được xử lý, nếu có thẻ HTML thì thay thế bằng '(Media)'
 */
export function replaceHTMLTagInMessageContent(input: string): string {
  // Regex kiểm tra thẻ HTML mở hoặc đóng
  const htmlTagRegex = /<([a-z][\w-]*)(\s[^>]*)?>.*?<\/\1>|<([a-z][\w-]*)(\s[^>]*)?\/?>/g
  return input.replace(htmlTagRegex, '(Media)')
}

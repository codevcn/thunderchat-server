import crypto from 'crypto'
import path from 'path'
import { Worker } from 'worker_threads'
import type { TRetryRequestOptions } from './types'
import validator from 'validator'
import { Express } from 'express'
import { fileTypeFromBuffer, FileTypeResult } from 'file-type'
import { EMessageMediaTypes } from '@/direct-message/direct-message.enum'
import { EGlobalMessages } from './enums'

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

/**
 * Xác định loại file từ buffer của file
 * @param {Express.Multer.File} file - File để xác định loại
 * @returns {Promise<EMessageMediaTypes>} Loại file
 */
export async function detectFileType(file: Express.Multer.File): Promise<EMessageMediaTypes> {
  const fileType: FileTypeResult | undefined = await fileTypeFromBuffer(file.buffer)

  if (!fileType) throw new Error(EGlobalMessages.UNKNOWN_FILE_TYPE)

  const mime = fileType.mime

  if (mime.startsWith('image/')) return EMessageMediaTypes.IMAGE
  if (mime.startsWith('video/')) return EMessageMediaTypes.VIDEO
  if (mime.startsWith('audio/')) return EMessageMediaTypes.AUDIO

  // Kiểm tra document (pdf, word, excel...)
  if (
    mime === 'application/pdf' ||
    mime === 'application/msword' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/vnd.ms-excel' ||
    mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    return EMessageMediaTypes.DOCUMENT
  }

  throw new Error(EGlobalMessages.UNKNOWN_FILE_TYPE)
}

/**
 * Định dạng kích thước file
 * @param {number} bytes - Kích thước file
 * @param {number} decimals - Số chữ số thập phân
 * @returns {string} Kích thước file đã được định dạng
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals

  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(dm))

  return `${value} ${sizes[i]}`
}

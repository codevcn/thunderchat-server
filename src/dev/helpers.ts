import fs from 'fs/promises'
import path from 'path'

export async function parseTxtFileToObject(
   relativeOrAbsolutePath: string
): Promise<Record<string, string>> {
   const filePath = path.isAbsolute(relativeOrAbsolutePath)
      ? relativeOrAbsolutePath
      : path.resolve(__dirname, relativeOrAbsolutePath)
   const content = await fs.readFile(filePath, 'utf-8')

   const lines = content.split('\n')

   const result: Record<string, string> = {}

   for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue // Bỏ dòng trống & comment

      const [key, ...valueParts] = trimmed.split('=')
      const value = valueParts.join('=').trim() // xử lý nếu value có dấu '='

      if (key && value !== undefined) {
         result[key.trim()] = value
      }
   }

   return result
}

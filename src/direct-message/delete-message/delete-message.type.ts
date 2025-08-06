import { Message } from '@prisma/client'

export type TDeleteMessageResult = {
  success: boolean
  message: string
  data: Message | null
  errorCode: string | null
  errors: unknown
}

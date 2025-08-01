import type { TDirectMessage } from '@/utils/entities/direct-message.entity'
import type { TUserWithProfile } from '@/utils/entities/user.entity'
import { ESyncDataToESWorkerType } from '@/utils/enums'
import { IsEnum, IsOptional } from 'class-validator'
import UserMessageEncryptor from '@/direct-message/security/es-message-encryptor'

export class SyncDataToESWorkerMessageDTO {
  @IsEnum(ESyncDataToESWorkerType)
  type: ESyncDataToESWorkerType

  data?: TDirectMessage | TUserWithProfile

  // @IsOptional()
  // msgEncryptor?: UserMessageEncryptor
}

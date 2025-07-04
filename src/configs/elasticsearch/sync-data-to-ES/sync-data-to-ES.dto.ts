import type { TDirectMessage } from '@/utils/entities/direct-message.entity'
import type { TProfile } from '@/utils/entities/profile.entity'
import type { TUser } from '@/utils/entities/user.entity'
import { ESyncDataToESWorkerType } from '@/utils/enums'
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator'
import UserMessageEncryptor from '@/direct-message/security/es-message-encryptor'

export class SyncDataToESWorkerMessageDTO {
   @IsEnum(ESyncDataToESWorkerType)
   type: ESyncDataToESWorkerType

   @IsNotEmpty()
   data: TDirectMessage | TUser | TProfile

   @IsOptional()
   msgEncryptor?: UserMessageEncryptor
}

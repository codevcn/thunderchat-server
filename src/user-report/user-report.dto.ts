import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  IsString,
  IsEnum,
  ValidateNested,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ReportCategory, MessageType } from '@prisma/client'

export class ReportedMessageDTO {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  messageId: number

  @IsNotEmpty()
  @IsEnum(MessageType)
  messageType: MessageType

  @IsNotEmpty()
  @IsString()
  @MaxLength(10000) // Limit message content length
  messageContent: string
}

export class CreateViolationReportDTO {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  reportedUserId: number

  @IsNotEmpty()
  @IsEnum(ReportCategory)
  reportCategory: ReportCategory

  @IsOptional()
  @IsString()
  @MaxLength(1000) // Limit reason text length
  reasonText?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportedMessageDTO)
  @ArrayMaxSize(10, { message: 'Maximum 10 reported messages allowed' })
  reportedMessages?: ReportedMessageDTO[]
}

import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator'
import { EHangupReason, ESDPType } from './voice-call.enum'
import { Type } from 'class-transformer'
import type { TVoiceCallSessionActiveId } from './voice-call.type'

export class CallRequestDTO {
  @IsNumber() @Type(() => Number) directChatId: number
  @IsNumber() @Type(() => Number) calleeUserId: number
}

export class CallAcceptDTO {
  @IsNumber() @Type(() => Number) sessionId: TVoiceCallSessionActiveId
}

export class CallRejectDTO {
  @IsNumber() @Type(() => Number) sessionId: TVoiceCallSessionActiveId
  @IsOptional() @IsString() reason?: string
}

export class CallHangupDTO {
  @IsNumber() @Type(() => Number) sessionId: TVoiceCallSessionActiveId
  @IsOptional() @IsEnum(EHangupReason) reason?: EHangupReason
}

export class SDPOfferAnswerDTO {
  @IsNumber() @Type(() => Number) sessionId: TVoiceCallSessionActiveId
  @IsString() SDP: string
  @IsString() type: ESDPType
}

export class IceCandidateDTO {
  @IsNumber() @Type(() => Number) sessionId: TVoiceCallSessionActiveId
  @IsString() candidate: string
  @IsOptional() @IsString() sdpMid?: string
  @IsOptional() @IsNumber() sdpMLineIndex?: number
}

export class CalleeSetSessionDTO {
  @IsNumber() @Type(() => Number) sessionId: TVoiceCallSessionActiveId
}

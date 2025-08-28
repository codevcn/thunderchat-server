import { IsString, IsOptional, IsNumber, IsEnum, IsNotEmpty } from 'class-validator'
import { EHangupReason, ESDPType } from './voice-call.enum'
import { Type } from 'class-transformer'
import type { TVoiceCallSessionActiveId } from './voice-call.type'

export class CallRequestDTO {
  @IsNumber() @Type(() => Number) directChatId: number
  @IsNumber() @Type(() => Number) calleeUserId: number
}

export class CallAcceptDTO {
  @IsNotEmpty() @IsString() sessionId: TVoiceCallSessionActiveId
}

export class CallRejectDTO {
  @IsNotEmpty() @IsString() sessionId: TVoiceCallSessionActiveId
  @IsOptional() @IsString() reason?: string
}

export class CallHangupDTO {
  @IsNotEmpty() @IsString() sessionId: TVoiceCallSessionActiveId
  @IsOptional() @IsEnum(EHangupReason) reason?: EHangupReason
}

export class SDPOfferAnswerDTO {
  @IsNotEmpty() @IsString() sessionId: TVoiceCallSessionActiveId
  @IsString() SDP: string
  @IsString() type: ESDPType
}

export class IceCandidateDTO {
  @IsNotEmpty() @IsString() sessionId: TVoiceCallSessionActiveId
  @IsString() candidate: string
  @IsOptional() @IsString() sdpMid?: string
  @IsOptional() @IsNumber() sdpMLineIndex?: number
}

export class CalleeSetSessionDTO {
  @IsNotEmpty() @IsString() sessionId: TVoiceCallSessionActiveId
}

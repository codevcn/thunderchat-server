import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator'
import { EHangupReason } from './voice-call.enum'
import { Type } from 'class-transformer'
import type { TVoiceCallSessionId } from '@/utils/entities/voice-call-session.entity'

export class CallRequestDTO {
  @IsNumber() @Type(() => Number) directChatId: number
  @IsNumber() @Type(() => Number) calleeUserId: number
}

export class CallAcceptDTO {
  @IsNumber() @Type(() => Number) sessionId: TVoiceCallSessionId
}

export class CallRejectDTO {
  @IsNumber() @Type(() => Number) sessionId: TVoiceCallSessionId
  @IsOptional() @IsString() reason?: string
}

export class CallCancelDTO {
  @IsNumber() @Type(() => Number) sessionId: TVoiceCallSessionId
}

export class CallEndDTO {
  @IsNumber() @Type(() => Number) sessionId: TVoiceCallSessionId
  @IsOptional() @IsEnum(EHangupReason) reason?: EHangupReason
}

export class SdpOfferDTO {
  @IsNumber() @Type(() => Number) sessionId: TVoiceCallSessionId
  @IsString() sdp: string
  @IsString() type: 'offer'
}

export class SdpAnswerDTO {
  @IsNumber() @Type(() => Number) sessionId: TVoiceCallSessionId
  @IsString() sdp: string
  @IsString() type: 'answer'
}

export class IceCandidateDTO {
  @IsNumber() @Type(() => Number) sessionId: TVoiceCallSessionId
  @IsString() candidate: string
  @IsOptional() @IsString() sdpMid?: string
  @IsOptional() @IsNumber() sdpMLineIndex?: number
}

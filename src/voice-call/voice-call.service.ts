import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { TVoiceCallSession } from '@/utils/entities/voice-call-session.entity'
import type { TUserId } from '@/user/user.type'
import { EVoiceCallMessage } from './voice-call.message'
import { EProviderTokens } from '@/utils/enums'
import { PrismaService } from '@/configs/db/prisma.service'
import type { TActiveVoiceCallSession, TVoiceCallSessionActiveId } from './voice-call.type'
import type { TDirectChat } from '@/utils/entities/direct-chat.entity'
import { v4 as uuidv4 } from 'uuid'
import { EVoiceCallStatus } from './voice-call.enum'

@Injectable()
export class VoiceCallService {
  private readonly activeCallSessions = new Map<
    TVoiceCallSessionActiveId,
    TActiveVoiceCallSession
  >() // để lưu trữ các call session đang diễn ra
  private readonly usersCalling = new Map<TUserId, TVoiceCallSessionActiveId>() // để tra cứu các user nào đang gọi

  constructor(@Inject(EProviderTokens.PRISMA_CLIENT) private prismaService: PrismaService) {}

  getActiveCallSession(sessionId: TVoiceCallSessionActiveId): TActiveVoiceCallSession | undefined {
    return this.activeCallSessions.get(sessionId)
  }

  initActiveCallSession(
    callerUserId: TUserId,
    calleeUserId: TUserId,
    directChatId: TDirectChat['id']
  ): TVoiceCallSessionActiveId {
    const tempSessionId = uuidv4()
    this.activeCallSessions.set(tempSessionId, {
      id: tempSessionId,
      status: EVoiceCallStatus.REQUESTING,
      callerUserId,
      calleeUserId,
      directChatId,
    })
    return tempSessionId
  }

  // async checkCallRequestInProgress(callerUserId: TUserId, calleeUserId: TUserId): Promise<boolean> {
  //   const count = await this.prismaService.voiceCallSession.count({
  //     where: {
  //       endedAt: null,
  //     },
  //   })
  //   return count > 0
  // }

  // async createSession(
  //   callerUserId: TUserId,
  //   calleeUserId: TUserId,
  //   directChatId?: number
  // ): Promise<TVoiceCallSession> {
  //   // nếu callee đang bận
  //   if (this.usersCalling.has(calleeUserId)) {
  //     throw new BadRequestException(EVoiceCallMessage.CALLEE_BUSY)
  //   }
  //   const inProgress = await this.checkCallRequestInProgress(callerUserId, calleeUserId)
  //   if (inProgress) {
  //     throw new BadRequestException(EVoiceCallMessage.TOO_MANY_CALLS)
  //   }
  //   const session = await this.prismaService.voiceCallSession.create({
  //     data: {
  //       callerUserId,
  //       calleeUserId,
  //       directChatId,
  //     },
  //   })
  //   this.activeCallSessions.set(session.id, { ...session, status: EVoiceCallStatus.REQUESTING })
  //   this.usersCalling.set(callerUserId, session.id)
  //   this.usersCalling.set(calleeUserId, session.id)
  //   return session
  // }

  acceptCall(sessionId: TVoiceCallSessionActiveId): TActiveVoiceCallSession {
    const session = this.callSessions.get(sessionId)
    if (!session) {
      throw new NotFoundException(EVoiceCallMessage.SESSION_NOT_FOUND)
    }
    if (
      session.status !== EVoiceCallSessionStatus.REQUESTING &&
      session.status !== EVoiceCallSessionStatus.RINGING
    ) {
      throw new BadRequestException(EVoiceCallMessage.INVALID_STATUS)
    }
    session.status = EVoiceCallSessionStatus.ACCEPTED
    return session
  }

  updateCallStatus(sessionId: TVoiceCallSessionId, status: EVoiceCallSessionStatus): void {
    const session = this.callSessions.get(sessionId)
    if (!session) {
      throw new NotFoundException(EVoiceCallMessage.SESSION_NOT_FOUND)
    }
    session.status = status
  }

  connectCall(sessionId: TVoiceCallSessionId): TVoiceCallSession {
    const session = this.callSessions.get(sessionId)
    if (!session) {
      throw new NotFoundException(EVoiceCallMessage.SESSION_NOT_FOUND)
    }
    session.status = EVoiceCallSessionStatus.CONNECTED
    return session
  }

  endCall(sessionId: TVoiceCallSessionActiveId): void {
    const session = this.getActiveCallSession(sessionId)
    if (!session) {
      throw new NotFoundException(EVoiceCallMessage.SESSION_NOT_FOUND)
    }
    this.activeCallSessions.delete(sessionId)
    if (this.usersCalling.get(session.callerUserId) === sessionId)
      this.usersCalling.delete(session.callerUserId)
    if (this.usersCalling.get(session.calleeUserId) === sessionId)
      this.usersCalling.delete(session.calleeUserId)
  }

  isUserBusy(userId: TUserId): boolean {
    return this.usersCalling.has(userId)
  }
}

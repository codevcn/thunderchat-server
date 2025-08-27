import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { TUserId } from '@/user/user.type'
import { EVoiceCallMessages } from './voice-call.message'
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
  ): TActiveVoiceCallSession {
    const tempSessionId = uuidv4()
    const session: TActiveVoiceCallSession = {
      id: tempSessionId,
      status: EVoiceCallStatus.REQUESTING,
      callerUserId,
      calleeUserId,
      directChatId,
    }
    this.activeCallSessions.set(tempSessionId, session)
    return session
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
    const session = this.getActiveCallSession(sessionId)
    if (!session) {
      throw new NotFoundException(EVoiceCallMessages.SESSION_NOT_FOUND)
    }
    if (
      session.status !== EVoiceCallStatus.REQUESTING &&
      session.status !== EVoiceCallStatus.RINGING
    ) {
      throw new BadRequestException(EVoiceCallMessages.INVALID_STATUS)
    }
    session.status = EVoiceCallStatus.ACCEPTED
    return session
  }

  updateCallStatus(
    sessionId: TVoiceCallSessionActiveId,
    status: EVoiceCallStatus
  ): TActiveVoiceCallSession {
    const session = this.getActiveCallSession(sessionId)
    if (!session) {
      throw new NotFoundException(EVoiceCallMessages.SESSION_NOT_FOUND)
    }
    session.status = status
    return session
  }

  // connectCall(sessionId: TVoiceCallSessionId): TVoiceCallSession {
  //   const session = this.callSessions.get(sessionId)
  //   if (!session) {
  //     throw new NotFoundException(EVoiceCallMessage.SESSION_NOT_FOUND)
  //   }
  //   session.status = EVoiceCallSessionStatus.CONNECTED
  //   return session
  // }

  endCall(sessionId: TVoiceCallSessionActiveId): TActiveVoiceCallSession {
    const session = this.getActiveCallSession(sessionId)
    if (!session) {
      throw new NotFoundException(EVoiceCallMessages.SESSION_NOT_FOUND)
    }
    this.activeCallSessions.delete(sessionId)
    if (this.usersCalling.get(session.callerUserId) === sessionId)
      this.usersCalling.delete(session.callerUserId)
    if (this.usersCalling.get(session.calleeUserId) === sessionId)
      this.usersCalling.delete(session.calleeUserId)
    return session
  }

  isUserBusy(userId: TUserId): boolean {
    return this.usersCalling.has(userId)
  }
}

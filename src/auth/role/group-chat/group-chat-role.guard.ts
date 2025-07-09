import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { GROUP_CHAT_ROLE_KEY } from './group-chat-role.decorator'
import { EGroupChatRoleMessages } from './group-chat-role.message'
import { TUserWithProfile } from '@/utils/entities/user.entity'
import { GroupMemberService } from '@/group-member/group-member.service'
import { EGroupChatMessages } from '@/group-chat/group-chat.message'
import { EGroupChatRoles } from '@/group-chat/group-chat.enum'
import { DevLogger } from '@/dev/dev-logger'
import { BaseHttpException } from '@/utils/exceptions/base-http.exception'

@Injectable()
export class GroupChatRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private groupMemberService: GroupMemberService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.authorizeUser(context)
    return true
  }

  private async authorizeUser(context: ExecutionContext): Promise<void> {
    // Lấy role yêu cầu từ metadata
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(GROUP_CHAT_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredRoles || requiredRoles.length === 0) return // Không có yêu cầu gì => cho qua

    const request = context.switchToHttp().getRequest()

    const groupChatId =
      request.query.groupChatId || request.body.groupChatId || request.params.groupChatId
    if (!groupChatId)
      throw new BaseHttpException(
        EGroupChatRoleMessages.GROUP_CHAT_ID_NOT_FOUND,
        HttpStatus.BAD_REQUEST
      )
    const groupChatIdNumber = parseInt(groupChatId)
    if (!groupChatIdNumber)
      throw new BaseHttpException(
        EGroupChatRoleMessages.GROUP_CHAT_ID_IS_NOT_VALID,
        HttpStatus.BAD_REQUEST
      )

    const user = request['user'] as TUserWithProfile
    if (!user) throw new InternalServerErrorException()

    const member = await this.groupMemberService.getGroupChatMember(groupChatIdNumber, user.id)
    if (!member)
      throw new BaseHttpException(EGroupChatMessages.MEMBER_NOT_FOUND, HttpStatus.NOT_FOUND)
    const memberRole = member.role as EGroupChatRoles

    // Kiểm tra xem user.role có nằm trong requiredRoles không
    if (!requiredRoles.includes(memberRole))
      throw new BaseHttpException(
        EGroupChatRoleMessages.MEMBER_HAS_NO_PERMISSION,
        HttpStatus.UNAUTHORIZED
      )
  }
}

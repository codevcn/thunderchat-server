import { IsEmail, IsISO8601, IsNotEmpty, IsNumber, IsOptional, MinLength } from 'class-validator'
import { ELengths } from '@/utils/enums'
import { EValidationMessages } from '@/utils/messages'
import { Type } from 'class-transformer'

export class CreateUserDTO {
  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsNotEmpty()
  @MinLength(ELengths.PASSWORD_MIN_LEN)
  password: string

  @IsNotEmpty()
  fullName: string

  @IsISO8601({}, { message: EValidationMessages.WRONG_DATE_ISO_TYPE })
  birthday: Date
}

export class GetUserByEmailDTO {
  @IsEmail()
  @IsNotEmpty()
  email: string
}

export class SearchUsersDTO {
  @IsNotEmpty()
  keyword: string

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  limit: number

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lastUserId?: number
}

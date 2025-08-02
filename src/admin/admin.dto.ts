import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator'

export class BanUserDTO {
  @IsNotEmpty()
  @IsString()
  reason: string
}

export class UnbanUserDTO {
  // Không cần thêm fields cho unban
}

export class GetUsersQueryDTO {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number
}

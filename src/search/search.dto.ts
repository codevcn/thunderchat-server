import { IsNotEmpty } from 'class-validator'

export class GlobalSearchPayloadDTO {
   @IsNotEmpty()
   keyword: string
}

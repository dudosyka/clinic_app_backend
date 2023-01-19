import { IsBoolean, IsNumber, ValidateIf, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { UserCreateDto } from "../../user/dtos/user-create.dto";

export class AppointmentCreateDto {

  @IsBoolean({
    message: "is_first must be boolean"
  })
  is_first: boolean

  @IsNumber({}, {
    message: "patient_id must be int"
  })
  @ValidateIf((object) => !object.is_first)
  patient_id: number

  @ValidateNested()
  @Type(() => UserCreateDto)
  @ValidateIf((object) => object.is_first)
  patient: UserCreateDto
}

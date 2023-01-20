import { PartialType } from "@nestjs/mapped-types";
import { UserCreateDto } from "./user-create.dto";
import { IsNumber, IsString, ValidateIf, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { DiagnosisDto } from "../../appointment/dtos/diagnosis.dto";

export class UserUpdateDto extends PartialType(UserCreateDto) {
  @IsNumber({}, {
    message: "id must be int"
  })
  id: number

  @IsString({
    message: "analysis must be string"
  })
  @ValidateIf((object, value) => value !== undefined)
  analysis: string

  @ValidateNested()
  @Type(() => DiagnosisDto)
  @ValidateIf((object, value) => value !== undefined)
  diagnosis: DiagnosisDto | null
}

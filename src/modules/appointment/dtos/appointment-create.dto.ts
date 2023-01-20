import { IsBoolean, IsNumber, IsString, ValidateIf, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { VaccineDto } from "./vaccine.dto";
import { UziDto } from "./uzi.dto";
import { DiagnosisDto } from "./diagnosis.dto";
import { DopplerDto } from "./doppler.dto";

export class AppointmentCreateDto {

  @IsBoolean({
    message: "is_first must be boolean"
  })
  is_first: boolean

  doctor_id: number

  @IsNumber({}, {
    message: "patient_id must be int"
  })
  @ValidateIf((object) => !object.is_first)
  patient_id: number

  @ValidateNested({each: true})
  @Type(() => VaccineDto)
  @ValidateIf((object, value) => value !== undefined)
  vaccine: VaccineDto[] | null

  @ValidateNested({each: true})
  @Type(() => UziDto)
  @ValidateIf((object, value) => value !== undefined)
  uzi: UziDto | null

  @ValidateNested()
  @Type(() => DopplerDto)
  doppler: DopplerDto

  @ValidateNested()
  @Type(() => DiagnosisDto)
  diagnosis: DiagnosisDto

  @IsString({
    message: "additional_information must be string"
  })
  additional_information: string

  @IsString({
    message: "recommended must be string"
  })
  recommended: string

  @IsString({
    each: true,
    message: "files must be array of string"
  })
  files: string[]
}

import { IsNumber } from "class-validator";

export class VaccineDto {
  @IsNumber({}, {
    message: "vaccine_localization_id must be int"
  })
  vaccine_localization_id: number

  @IsNumber({}, {
    message: "vaccine_microflora_id must be int"
  })
  vaccine_microflora_id: number

  @IsNumber({}, {
    message: "vaccine_value_id must be int"
  })
  vaccine_value_id: number

  @IsNumber({}, {
    message: "timestamp must be int"
  })
  timestamp: number
}

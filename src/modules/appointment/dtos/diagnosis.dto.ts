import { IsString } from "class-validator";

export class DiagnosisDto {
  @IsString({
    message: "pregnancy must be string"
  })
  pregnancy: string

  @IsString({
    message: "value must be string"
  })
  value: string
}

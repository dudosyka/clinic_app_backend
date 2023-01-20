import { IsString } from "class-validator";

export class DopplerDto {
  @IsString({
    message: "date_of_hemodynamic_disorder must be string"
  })
  date_of_hemodynamic_disorder: string

  @IsString({
    message: "pregnancy_course must be string"
  })
  pregnancy_course: string

  @IsString({
    message: "objective_research must be string"
  })
  objective_research: string

  @IsString({
    message: "gynecological_examination must be string"
  })
  gynecological_examination: string
}

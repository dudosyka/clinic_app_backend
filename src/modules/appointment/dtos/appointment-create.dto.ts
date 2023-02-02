import {
  IsBoolean, IsJSON,
  IsNumber,
} from 'class-validator';

export class AppointmentCreateDto {
  @IsBoolean({
    message: 'is_first must be boolean',
  })
  is_first: boolean;

  doctor_id: number;

  @IsNumber(
    {},
    {
      message: 'patient_id must be int',
    },
  )
  patient_id: number;

   @IsJSON({
     message: 'value must be valid JSON'
   })
  value: string
}

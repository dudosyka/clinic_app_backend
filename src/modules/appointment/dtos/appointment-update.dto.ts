import { AppointmentCreateDto } from './appointment-create.dto';
import { PartialType } from '@nestjs/mapped-types';
import { IsNumber } from 'class-validator';

export class AppointmentUpdateDto extends PartialType(AppointmentCreateDto) {
  @IsNumber(
    {},
    {
      message: 'id must be string',
    },
  )
  id: number;
}

import { VaccineDto } from './vaccine.dto';
import { PartialType } from '@nestjs/mapped-types';
import { IsNumber } from 'class-validator';

export class UziUpdateDto extends PartialType(VaccineDto) {
  @IsNumber(
    {},
    {
      message: 'id must be int',
    },
  )
  id: number;
}

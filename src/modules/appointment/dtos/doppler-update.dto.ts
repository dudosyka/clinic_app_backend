import { IsNumber } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { DopplerDto } from './doppler.dto';

export class DopplerUpdateDto extends PartialType(DopplerDto) {
  @IsNumber(
    {},
    {
      message: 'id must be int',
    },
  )
  id: number;
}

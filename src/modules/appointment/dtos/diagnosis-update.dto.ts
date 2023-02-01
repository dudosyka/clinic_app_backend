import { PartialType } from '@nestjs/mapped-types';
import { DiagnosisDto } from './diagnosis.dto';
import { IsNumber } from 'class-validator';

export class DiagnosisUpdateDto extends PartialType(DiagnosisDto) {
  @IsNumber(
    {},
    {
      message: 'id must be int',
    },
  )
  id: number;
}

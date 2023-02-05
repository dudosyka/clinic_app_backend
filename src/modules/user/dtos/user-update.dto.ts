import { PartialType } from '@nestjs/mapped-types';
import { UserCreateDto } from './user-create.dto';
import {
  IsNumber,
} from 'class-validator';

export class UserUpdateDto extends PartialType(UserCreateDto) {
  @IsNumber(
    {},
    {
      message: 'id must be int',
    },
  )
  id: number;

  hash: string;
}

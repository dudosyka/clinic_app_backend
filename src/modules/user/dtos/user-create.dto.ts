import { UserRole } from '../../../confs/main.conf';
import {IsNumber, IsString, MinLength, ValidateIf} from 'class-validator';

export class UserCreateDto {
  @IsNumber(
    {},
    {
      message: 'role must be int',
    },
  )
  role: UserRole;

  @IsString({
    message: 'login must be string',
  })
  @MinLength(3)
  @ValidateIf((object) => object.role === 1)
  login?: string;

  @IsString({
    message: 'password must be string',
  })
  @ValidateIf((object) => object.role === 1)
  password?: string;

  @IsString({
    message: 'rank must be string',
  })
  @ValidateIf((object) => object.role === 1)
  rank?: string;

  @IsString({
    message: 'position must be string',
  })
  @ValidateIf((object) => object.role === 1)
  position?: string;

  @IsString({
    message: 'surname must be string',
  })
  @MinLength(3)
  surname: string;

  @IsString({
    message: 'name must be string',
  })
  @MinLength(2)
  name: string;

  @IsString({
    message: 'lastname must be string',
  })
  @MinLength(3)
  lastname: string;

  @IsString({
    message: 'birthday must be string',
  })
  @MinLength(10)
  @ValidateIf((object) => object.role === 2)
  birthday?: string;
}

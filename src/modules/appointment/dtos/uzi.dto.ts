import { IsNumber, IsString } from 'class-validator';

export class UziDto {
  @IsString({
    message: 'value must be string',
  })
  value: string;

  @IsNumber(
    {},
    {
      message: 'timestamp must be number',
    },
  )
  timestamp: number;
}

import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Inject,
  Post,
} from '@nestjs/common';
import { LoggerService } from '../services/logger.service';
import loggerConf from '../../../confs/logger.conf';
import { ErrorOutputDto } from '../dtos/error.output.dto';
import {
  ResponseFilter,
  ResponseStatus,
} from '../../../filters/response.filter';

@Controller('logger')
export class LoggerController {
  constructor(@Inject(LoggerService) private loggerProvider: LoggerService) {}

  @Post()
  @HttpCode(ResponseStatus.SUCCESS)
  public async getAll(
    @Body('passphrase') passphrase: string,
  ): Promise<ResponseFilter<ErrorOutputDto[]>> | never {
    if (passphrase == loggerConf.passphrase)
      return ResponseFilter.response<ErrorOutputDto[] | {}[]>(
        (await this.loggerProvider.getAll()).map((el) => {
          try {
            return {
              id: el.id,
              name: el.name,
              message: el.message,
              stack: JSON.parse(el.stack),
              // image: el.image,
              timestamp: el.createdAt,
            };
          } catch (err) {
            return {};
          }
        }),
        ResponseStatus.SUCCESS,
      );
    else
      throw new ForbiddenException(
        new Error('Failed passphrase'),
        'Passphrase check failed',
      );
  }
}

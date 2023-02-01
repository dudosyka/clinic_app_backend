import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LoggerModel } from '../models/logger.model';
import { ErrorCreateDto } from '../dtos/error.create.dto';
import { BaseService } from '../../base/base.service';

@Injectable()
export class LoggerService extends BaseService<LoggerModel> {
  constructor(@InjectModel(LoggerModel) private loggerModel: LoggerModel) {
    super(LoggerModel);
  }

  public async log(error: ErrorCreateDto): Promise<void> {
    LoggerModel.create(error).catch((err) => {
      console.log(err);
    });
  }

  public async getAll(): Promise<LoggerModel[]> {
    return await super.getAll({
      order: [['id', 'DESC']],
    });
  }
}

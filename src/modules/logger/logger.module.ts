import { Module } from '@nestjs/common';
import { LoggerController } from './controllers/logger.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { LoggerModel } from './models/logger.model';
import { LoggerService } from './services/logger.service';

@Module({
  imports: [SequelizeModule.forFeature([LoggerModel])],
  controllers: [LoggerController],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}

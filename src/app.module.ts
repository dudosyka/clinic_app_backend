import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {BcryptUtil} from "./utils/bcrypt.util";
import {APP_FILTER} from "@nestjs/core";
import {GlobalExceptionFilter} from "./filters/global-exception.filter";
import {HttpExceptionFilter} from "./filters/http-exception.filter";
import {ValidationExceptionFilter} from "./filters/validation-exception.filter";
import {DatabaseErrorFilter} from "./filters/database-error.filter";
import { SequelizeModule } from "@nestjs/sequelize";
import { default as main, ProjectState } from "./confs/main.conf";
import { default as db } from "./confs/db.conf";
import {LoggerModule} from "./modules/logger/logger.module";
import {UserModule} from "./modules/user/user.module";
import { AppointmentModule } from "./modules/appointment/appointment.module";

const db_conf = main.isDev == ProjectState.DEV ? db.dev : db.prod;

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: "mysql",
      ...db_conf,
      autoLoadModels: true,
      synchronize: true
    }),
    LoggerModule,
    UserModule,
    AppointmentModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    BcryptUtil,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter
    },
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter
    },
    {
      provide: APP_FILTER,
      useClass: DatabaseErrorFilter
    }
  ],
})
export class AppModule {}

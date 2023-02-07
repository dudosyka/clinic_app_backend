import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AppointmentModel } from './models/appointment.model';
import { AppointmentService } from './services/appointment.service';
import { AppointmentController } from './controllers/appointment.controller';
import { UserModule } from '../user/user.module';
import { ReferencesService } from './services/references.service';
import { ReferencesController } from './controllers/references.controller';
import {MulterModule} from "@nestjs/platform-express";
import {MulterConfigModule} from "./multer-config.module";
import {UserFilesModel} from "../user/models/user-files.model";

@Module({
  imports: [
    SequelizeModule.forFeature([
      AppointmentModel,
      UserFilesModel
    ]),
    MulterModule.registerAsync({
      useClass: MulterConfigModule
    }),
    UserModule,
  ],
  providers: [AppointmentService, ReferencesService],
  controllers: [AppointmentController, ReferencesController],
  exports: [AppointmentService],
})
export class AppointmentModule {}

import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AppointmentModel } from "./models/appointment.model";
import { AppointmentService } from "./services/appointment.service";
import { AppointmentController } from "./controllers/appointment.controller";
import { InoculationModel } from "./models/inoculation.model";
import { AnalysisModel } from "./models/analysis.model";
import { UltrasoundModel } from "./models/ultrasound.model";
import { AppointmentInoculationModel } from "./models/appointment-inoculation.model";
import { AppointmentAnalysisModel } from "./models/appointment-analysis.model";
import { AppointmentUltrasoundModel } from "./models/appointment-ultrasound.model";

@Module({
  imports: [
    SequelizeModule.forFeature([
      AppointmentModel,
      InoculationModel,
      AnalysisModel,
      UltrasoundModel,
      AppointmentInoculationModel,
      AppointmentAnalysisModel,
      AppointmentUltrasoundModel
    ])
  ],
  providers: [ AppointmentService ],
  controllers: [ AppointmentController ],
  exports: [ AppointmentService ]
})
export class AppointmentModule {}

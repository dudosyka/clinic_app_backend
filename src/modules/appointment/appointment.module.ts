import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AppointmentModel } from "./models/appointment.model";
import { AppointmentService } from "./services/appointment.service";
import { AppointmentController } from "./controllers/appointment.controller";
import { VaccineModel } from "./models/vaccine.model";
import { UziModel } from "./models/uzi.model";
import { AppointmentVaccineModel } from "./models/appointment-vaccine.model";
import { AppointmentUziModel } from "./models/appointment-uzi.model";
import { UserModule } from "../user/user.module";
import { DopplerModel } from "./models/doppler.model";
import { AbTherapyReference } from "./models/references/ab-therapy.reference";
import { DiabetesMelitusReference } from "./models/references/diabetes-melitus.reference";
import { EyeDiseaseReference } from "./models/references/eye-disease.reference";
import { GeneCarriageReference } from "./models/references/gene-carriage.reference";
import { GsdReference } from "./models/references/gsd.reference";
import { HemodinDisordersReference } from "./models/references/hemodin-disorders.reference";
import { IvfReference } from "./models/references/ivf.reference";
import { IvigReference } from "./models/references/ivig.reference";
import { NmhReference } from "./models/references/nmh.reference";
import { OagaReference } from "./models/references/oaga.reference";
import { ObesityReference } from "./models/references/obesity.reference";
import { PlasmapharesisReference } from "./models/references/plasmapharesis.reference";
import { TwinsReference } from "./models/references/twins.reference";
import { UternusScarReference } from "./models/references/uternus-scar.reference";
import { VaccineMicrofloraReference } from "./models/references/vaccine.microflora.reference";
import { VaccineLocalizationReference } from "./models/references/vaccine-localization.reference";
import { VaccineValueReference } from "./models/references/vaccine-value.reference";
import { ReferencesService } from "./services/references.service";
import { ReferencesController } from "./controllers/references.controller";

@Module({
  imports: [
    SequelizeModule.forFeature([
      DopplerModel,
      AppointmentModel,
      VaccineModel,
      UziModel,
      AppointmentVaccineModel,
      AppointmentUziModel,

      AbTherapyReference,
      DiabetesMelitusReference,
      EyeDiseaseReference,
      GeneCarriageReference,
      GsdReference,
      HemodinDisordersReference,
      IvfReference,
      IvigReference,
      NmhReference,
      OagaReference,
      ObesityReference,
      PlasmapharesisReference,
      TwinsReference,
      UternusScarReference,
      VaccineMicrofloraReference,
      VaccineLocalizationReference,
      VaccineValueReference
    ]),
    UserModule
  ],
  providers: [ AppointmentService, ReferencesService ],
  controllers: [ AppointmentController, ReferencesController ],
  exports: [ AppointmentService ]
})
export class AppointmentModule {}

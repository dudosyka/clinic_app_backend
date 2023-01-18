import { BaseModel } from "../../base/base.service";
import { AutoIncrement, BelongsTo, BelongsToMany, Column, PrimaryKey, Table } from "sequelize-typescript";
import { UserModel } from "../../user/models/user.model";
import { AnalysisModel } from "./analysis.model";
import { AppointmentAnalysisModel } from "./appointment-analysis.model";
import { AppointmentInoculationModel } from "./appointment-inoculation.model";
import { UltrasoundModel } from "./ultrasound.model";
import { InoculationModel } from "./inoculation.model";
import { AppointmentUltrasoundModel } from "./appointment-ultrasound.model";

@Table
export class AppointmentModel extends BaseModel {
  @Column
  @PrimaryKey
  @AutoIncrement
  id: number

  @Column({
    defaultValue: false
  })
  isFirst: boolean

  @Column({
    allowNull: false
  })
  patient_id: number

  @BelongsTo(() => UserModel, 'patient_id')
  patient: UserModel

  @Column({
    allowNull: false
  })
  doctor_id: number

  @BelongsTo(() => UserModel, 'doctor_id')
  doctor: UserModel

  @BelongsToMany(() => AnalysisModel, () => AppointmentAnalysisModel, 'appointment_id', 'analysis_id')
  analysis: AnalysisModel

  @BelongsToMany(() => InoculationModel, () => AppointmentInoculationModel, 'appointment_id', 'inoculation_id')
  inoculations: InoculationModel

  @BelongsToMany(() => UltrasoundModel, () => AppointmentUltrasoundModel, 'appointment_id', 'ultrasound_id')
  ultrasounds: UltrasoundModel
}

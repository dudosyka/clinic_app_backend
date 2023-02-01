import { BaseModel } from '../../base/base.service';
import {
  AutoIncrement,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { UserModel } from '../../user/models/user.model';
import { AppointmentVaccineModel } from './appointment-vaccine.model';
import { UziModel } from './uzi.model';
import { VaccineModel } from './vaccine.model';
import { AppointmentUziModel } from './appointment-uzi.model';
import { DopplerModel } from './doppler.model';
import { DiagnosisModel } from './diagnosis.model';

@Table
export class AppointmentModel extends BaseModel {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({
    defaultValue: false,
  })
  is_first: boolean;

  @Column({
    allowNull: false,
  })
  patient_id: number;

  @BelongsTo(() => UserModel, 'patient_id')
  patient: UserModel;

  @Column({
    allowNull: false,
  })
  doctor_id: number;

  @BelongsTo(() => UserModel, 'doctor_id')
  doctor: UserModel;

  @BelongsToMany(() => VaccineModel, {
    through: () => AppointmentVaccineModel,
  })
  vaccine: VaccineModel[];

  @BelongsToMany(() => UziModel, {
    through: () => AppointmentUziModel,
  })
  uzi: UziModel[];

  @Column
  doppler_id: number;

  @BelongsTo(() => DopplerModel, 'doppler_id')
  doppler: DopplerModel;

  @Column({
    type: DataType.TEXT,
  })
  additional_information: string;

  @Column
  diagnosis_id: number;

  @BelongsTo(() => DiagnosisModel, 'diagnosis_id')
  diagnosis: DiagnosisModel;

  @Column({
    type: DataType.TEXT,
  })
  recommended: string;
}

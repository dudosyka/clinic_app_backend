import { BaseModel } from '../../base/base.service';
import {
  AutoIncrement,
  Column,
  ForeignKey,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { AppointmentModel } from './appointment.model';
import { UziModel } from './uzi.model';

@Table
export class AppointmentUziModel extends BaseModel {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  @ForeignKey(() => AppointmentModel)
  appointment_id: number;

  @Column
  @ForeignKey(() => UziModel)
  uzi_id: number;
}

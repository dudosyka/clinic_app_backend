import { BaseModel } from '../../base/base.service';
import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { UserModel } from '../../user/models/user.model';

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

  @Column({
    type: DataType.JSON
  })
  value: string
}

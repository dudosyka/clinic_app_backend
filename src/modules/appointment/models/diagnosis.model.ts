import { BaseModel } from '../../base/base.service';
import {
  AutoIncrement,
  Column,
  DataType,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

@Table
export class DiagnosisModel extends BaseModel {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  pregnancy: string;

  @Column({
    type: DataType.TEXT,
  })
  value: string;
}

import { BaseModel } from '../../base/base.service';
import {
  AutoIncrement,
  Column,
  DataType,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

@Table
export class UziModel extends BaseModel {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({
    type: DataType.TEXT,
  })
  value: string;

  @Column({
    type: DataType.BIGINT,
  })
  timestamp: number;
}

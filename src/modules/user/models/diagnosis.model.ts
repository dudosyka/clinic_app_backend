import { BaseModel } from "../../base/base.service";
import { AutoIncrement, Column, PrimaryKey, Table } from "sequelize-typescript";

@Table
export class DiagnosisModel extends BaseModel {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number

  @Column
  pregnancy: number
}

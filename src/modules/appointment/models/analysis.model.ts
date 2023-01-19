import { BaseModel } from "../../base/base.service";
import { AutoIncrement, Column, DataType, PrimaryKey, Table } from "sequelize-typescript";

@Table
export class AnalysisModel extends BaseModel {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number

  @Column
  name: string

  @Column({
    type: DataType.TEXT
  })
  value: string

  @Column({
    type: DataType.BIGINT
  })
  timestamp: number
}

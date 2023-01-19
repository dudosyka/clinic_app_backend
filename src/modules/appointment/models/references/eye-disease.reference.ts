import { Column, Model, PrimaryKey, Table } from "sequelize-typescript";

@Table
export class EyeDiseaseReference extends Model {
  @PrimaryKey
  @Column
  id: number

  @Column
  value: string
}

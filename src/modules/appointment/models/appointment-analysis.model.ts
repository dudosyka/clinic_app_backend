import { BaseModel } from "../../base/base.service";
import { AutoIncrement, Column, ForeignKey, PrimaryKey, Table } from "sequelize-typescript";
import { AppointmentModel } from "./appointment.model";
import { AnalysisModel } from "./analysis.model";

@Table
export class AppointmentAnalysisModel extends BaseModel {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number

  @Column
  @ForeignKey(() => AppointmentModel)
  appointment_id: number

  @Column
  @ForeignKey(() => AnalysisModel)
  analysis_id: number
}

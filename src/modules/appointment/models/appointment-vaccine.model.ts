import { BaseModel } from "../../base/base.service";
import { AutoIncrement, Column, ForeignKey, PrimaryKey, Table } from "sequelize-typescript";
import { AppointmentModel } from "./appointment.model";
import { VaccineModel } from "./vaccine.model";

@Table
export class AppointmentVaccineModel extends BaseModel {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number

  @Column
  @ForeignKey(() => AppointmentModel)
  appointment_id: number

  @Column
  @ForeignKey(() => VaccineModel)
  vaccine_id: number
}

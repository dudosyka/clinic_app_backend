import { BaseModel } from "../../base/base.service";
import { AutoIncrement, BelongsTo, Column, DataType, PrimaryKey, Table } from "sequelize-typescript";
import { VaccineLocalizationReference } from "./references/vaccine-localization.reference";
import { VaccineMicrofloraReference } from "./references/vaccine.microflora.reference";
import { VaccineValueReference } from "./references/vaccine-value.reference";

@Table
export class VaccineModel extends BaseModel {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number

  @Column
  vaccine_localization_id: string

  @BelongsTo(() => VaccineLocalizationReference, 'vaccine_localization_id')
  localization: VaccineLocalizationReference

  @Column
  vaccine_microflora_id: number

  @BelongsTo(() => VaccineMicrofloraReference, 'vaccine_microflora_id')
  microflora: VaccineMicrofloraReference

  @Column
  vaccine_value_id: string

  @BelongsTo(() => VaccineValueReference, 'vaccine_value_id')
  value: VaccineValueReference

  @Column({
    type: DataType.BIGINT
  })
  timestamp: number
}

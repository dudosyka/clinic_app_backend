import { BaseModel } from '../../base/base.service';
import { AutoIncrement, Column, PrimaryKey, Table } from 'sequelize-typescript';

@Table
export class DopplerModel extends BaseModel {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  date_of_hemodynamic_disorder: string;

  @Column
  pregnancy_course: string;

  @Column
  objective_research: string;

  @Column
  gynecological_examination: string;
}

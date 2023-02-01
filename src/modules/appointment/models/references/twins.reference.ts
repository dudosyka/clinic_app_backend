import { Column, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table
export class TwinsReference extends Model {
  @PrimaryKey
  @Column
  id: number;

  @Column
  value: string;
}

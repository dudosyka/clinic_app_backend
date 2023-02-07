import {
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import {UserFilesModel} from "./user-files.model";

@Table
export class UserModel extends Model {

  @Column({
    allowNull: false,
  })
  login: string;

  @Column({
    allowNull: false,
  })
  hash: string;

  @Column({
    allowNull: false,
  })
  role: number;

  @Column({
    type: DataType.BOOLEAN
  })
  deleted: boolean;

  @Column
  rank: string;

  @Column
  position: string;

  @Column
  surname: string;

  @Column
  name: string;

  @Column
  lastname: string;

  @Column
  birthday: string;

  @Column({
    type: DataType.TEXT,
  })
  analysis: string;

  @BelongsToMany(() => UserFilesModel, () => UserFilesModel, 'user_id', 'id')
  files: UserFilesModel[]
}

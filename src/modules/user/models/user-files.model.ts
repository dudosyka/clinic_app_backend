import {AutoIncrement, Column, ForeignKey, Model, PrimaryKey, Table} from 'sequelize-typescript';
import {UserModel} from "./user.model";

@Table
export class UserFilesModel extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @ForeignKey(() => UserModel)
    @Column
    user_id: number

    @Column
    name: string;

    @Column
    path: string;
}
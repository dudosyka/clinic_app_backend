import { AutoIncrement, Column, Model, PrimaryKey, Table } from "sequelize-typescript";

@Table
export class UserModel extends Model {

    @Column
    @PrimaryKey
    @AutoIncrement
    id: number

    @Column({
        allowNull: false
    })
    login: string

    @Column({
        allowNull: false
    })
    hash: string

    @Column({
        allowNull: false
    })
    role: number

    @Column
    rank: string

    @Column
    position: string

    @Column
    surname: string

    @Column
    name: string

    @Column
    lastname: string

    @Column
    birthday: string
}

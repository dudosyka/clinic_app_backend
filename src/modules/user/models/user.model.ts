import { AutoIncrement, Column, DataType, Model, PrimaryKey, Table } from "sequelize-typescript";

@Table
export class UserModel extends Model {

    @PrimaryKey
    @AutoIncrement
    @Column
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

    @Column({
        type: DataType.TEXT
    })
    analysis: string
}

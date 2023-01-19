import { AutoIncrement, BelongsTo, Column, Model, PrimaryKey, Table } from "sequelize-typescript";
import { DiagnosisModel } from "./diagnosis.model";

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

    @Column
    diagnosis_id: number

    @BelongsTo(() => DiagnosisModel, "diagnosis_id")
    diagnosis: DiagnosisModel
}

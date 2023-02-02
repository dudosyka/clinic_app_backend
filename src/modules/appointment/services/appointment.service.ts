import {Injectable, StreamableFile} from '@nestjs/common';
import { AppointmentModel } from '../models/appointment.model';
import { BaseService } from '../../base/base.service';
import { AppointmentCreateDto } from '../dtos/appointment-create.dto';
import { AppointmentUpdateDto } from '../dtos/appointment-update.dto';
import { TransactionUtil } from '../../../utils/TransactionUtil';
import { Sequelize } from 'sequelize-typescript';
import { ModelNotFoundException } from '../../../exceptions/model-not-found.exception';
import { UserModel } from '../../user/models/user.model';
import { BadRequestException } from '../../../exceptions/bad-request.exception';
import {AppointmentFilterDto} from "../dtos/appointment-filter.dto";
import {Op} from "sequelize";
import mainConf from "../../../confs/main.conf";
import {UserFilesModel} from "../../user/models/user-files.model";
import {createReadStream} from 'fs';
import {join} from 'path'
import * as process from "process";

@Injectable()
export class AppointmentService extends BaseService<AppointmentModel> {
  constructor(private sequelize: Sequelize) {
    super(AppointmentModel);
  }

  public async checkIsFirstAppointment(patient_id: number): Promise<boolean> {
    const appointmentModel = await AppointmentModel.findOne({
      where: {
        patient_id,
      },
    });

    return !!appointmentModel;
  }

  public async create(
    createDto: AppointmentCreateDto,
  ): Promise<AppointmentModel> {
    let isPropagate = true;
    if (!TransactionUtil.isSet()) {
      TransactionUtil.setHost(await this.sequelize.transaction());
      isPropagate = false;
    }

    if (createDto.is_first) {
      if (await this.checkIsFirstAppointment(createDto.patient_id))
        throw new BadRequestException('first appointment has already created');
    }

    const patientModel = await UserModel.findOne({
      where: {
        id: createDto.patient_id
      }
    });

    if (patientModel.role < 2) throw new BadRequestException("You must provide patient id")

    const appointment = await AppointmentModel.create(
      {
        ...createDto,
      },
      TransactionUtil.getHost(),
    ).catch((err) => {
      if (!isPropagate) TransactionUtil.rollback();
      throw err;
    });

    if (!isPropagate) await TransactionUtil.commit();

    return appointment;
  }

  public async _getOne(
      id: number
  ): Promise<{ id, is_first, patient, doctor, value }> {
    const model = await super.getOne({
      where: {
        id,
      },
      include: [
        { model: UserModel, as: 'patient', include: [ UserFilesModel ] },
        { model: UserModel, as: 'doctor' }
      ],
    });
    return {
      id: model.id,
      is_first: model.is_first,
      patient: model.patient,
      doctor: model.doctor,
      value: JSON.parse(model.value)
    }
  }

  public async getLast(patient_id: number): Promise<AppointmentModel> {
    const models = await AppointmentModel.findAll({
      where: {
        patient_id,
      },
      order: [['id', 'DESC']],
    });

    if (!models.length)
      throw new ModelNotFoundException(AppointmentModel, null);

    console.log(models);


    return models[0];
  }

  public async getAll(filters: AppointmentFilterDto) {

    let order = [];
    if (filters.sortDate)
      order = [['createdAt', filters.sortDate]]

    let where = {}
    if (filters.patientFullname) {
      const patientFullname = filters.patientFullname.split(" ");
      where = {
        [Op.or]: [
          {
            surname: {
              [Op.like]: `%${patientFullname[0]}%`
            },
          },
          {
            name: {
              [Op.like]: `%${patientFullname[1]}%`
            },
          },
          {
            lastname: {
              [Op.like]: `%${patientFullname[2]}%`
            }
          }
        ]
      }
    }

    let page = 1;
    if (filters.page)
      page = filters.page

    return AppointmentModel.findAll({
      attributes: ['id', 'createdAt'],
      offset: (page-1)*mainConf.limit,
      limit: mainConf.limit * page,
      order,
      include: [ { model: UserModel, as: 'patient', where, attributes:['name', 'surname', 'lastname', 'birthday'] }, { model: UserModel, as: 'doctor',  attributes:['name', 'surname', 'lastname'] } ]
    });
  }

  public async update(
    updateDto: AppointmentUpdateDto,
  ): Promise<AppointmentModel> {
    const appointmentModel = await super.getOne({
      where: { id: updateDto.id },
    });

    if (updateDto.is_first)
      throw new BadRequestException('You can`t change is_first status!');

    await appointmentModel.update({ ...updateDto });

    return appointmentModel;
  }

  public async remove(id: number): Promise<void> {
    const model = await super.getOne({ where: { id } });

    TransactionUtil.setHost(await this.sequelize.transaction());

    //If we remove "is_first" appointment and this user has other appointments we should to mark oldest as "is_first"
    if (model.is_first) {
      const other = await AppointmentModel.findAll();

      if (other.length > 1) {
        await other[1].update(
          {
            is_first: true,
          },
          TransactionUtil.getHost(),
        );
      }
    }

    await TransactionUtil.commit();
  }

  async uploadFile(id: number, file: Express.Multer.File): Promise<void> {
    const model = await UserModel.findOne({
      where: {id}
    }).catch(err => {
      throw err;
    });

    if (!model) throw new ModelNotFoundException(UserModel, id)

    await UserFilesModel.create({
      user_id: model.id,
      path: file.filename,
      name: file.originalname
    })
  }

  async getFileStream(fileId: number) {
    const fileModel = await UserFilesModel.findOne({
      where: {
        id: fileId
      }
    });

    if (!fileModel)
      throw new ModelNotFoundException(UserFilesModel, fileId)

    console.log(process.cwd());
    const file = createReadStream(join(process.cwd(), 'upload', fileModel.path));
    return new StreamableFile(file);
  }
}

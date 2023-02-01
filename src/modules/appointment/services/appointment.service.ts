import { Injectable } from '@nestjs/common';
import { AppointmentModel } from '../models/appointment.model';
import { BaseService } from '../../base/base.service';
import { AppointmentCreateDto } from '../dtos/appointment-create.dto';
import { AppointmentUpdateDto } from '../dtos/appointment-update.dto';
import { DopplerModel } from '../models/doppler.model';
import { UziModel } from '../models/uzi.model';
import { AppointmentUziModel } from '../models/appointment-uzi.model';
import { VaccineModel } from '../models/vaccine.model';
import { AppointmentVaccineModel } from '../models/appointment-vaccine.model';
import { TransactionUtil } from '../../../utils/TransactionUtil';
import { Sequelize } from 'sequelize-typescript';
import { VaccineUpdateDto } from '../dtos/vaccine-update.dto';
import { ModelNotFoundException } from '../../../exceptions/model-not-found.exception';
import { UziUpdateDto } from '../dtos/uzi-update.dto';
import { DopplerUpdateDto } from '../dtos/doppler-update.dto';
import { UserModel } from '../../user/models/user.model';
import { DiagnosisModel } from '../models/diagnosis.model';
import { BadRequestException } from '../../../exceptions/bad-request.exception';
import { DiagnosisUpdateDto } from '../dtos/diagnosis-update.dto';

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

    const files = JSON.stringify(createDto.files);

    let doppler_id = null;
    if (createDto.doppler) {
      const doppler = createDto.doppler;
      const dopplerModel = await DopplerModel.create(
        { ...doppler },
        TransactionUtil.getHost(),
      ).catch((err) => {
        if (!isPropagate) TransactionUtil.rollback();
        throw err;
      });
      doppler_id = dopplerModel.id;
    }

    let diagnosis_id = null;
    if (createDto.diagnosis) {
      const diagnosis = createDto.diagnosis;
      const diagnosisModel = await DiagnosisModel.create(
        { ...diagnosis },
        TransactionUtil.getHost(),
      ).catch((err) => {
        if (!isPropagate) TransactionUtil.rollback();
        throw err;
      });
      diagnosis_id = diagnosisModel.id;
    }

    if (createDto.is_first) {
      if (await this.checkIsFirstAppointment(createDto.patient_id))
        throw new BadRequestException('first appointment has already created');
    }

    const appointment = await AppointmentModel.create(
      {
        ...createDto,
        files,
        doppler_id,
        diagnosis_id,
      },
      TransactionUtil.getHost(),
    ).catch((err) => {
      if (!isPropagate) TransactionUtil.rollback();
      throw err;
    });

    if (createDto.uzi) {
      const uzi = createDto.uzi;
      const uziModel = await UziModel.create(
        { ...uzi },
        TransactionUtil.getHost(),
      ).catch((err) => {
        if (!isPropagate) TransactionUtil.rollback();
        throw err;
      });
      await AppointmentUziModel.create(
        {
          appointment_id: appointment.id,
          uzi_id: uziModel.id,
        },
        TransactionUtil.getHost(),
      ).catch((err) => {
        if (!isPropagate) TransactionUtil.rollback();
        throw err;
      });
    }

    if (createDto.vaccine) {
      const vaccines = createDto.vaccine;
      await Promise.all(
        vaccines.map(async (vaccine) => {
          const vaccineModel = await VaccineModel.create(
            { ...vaccine },
            TransactionUtil.getHost(),
          ).catch((err) => {
            if (!isPropagate) TransactionUtil.rollback();
            throw err;
          });
          await AppointmentVaccineModel.create(
            {
              appointment_id: appointment.id,
              vaccine_id: vaccineModel.id,
            },
            TransactionUtil.getHost(),
          ).catch((err) => {
            throw err;
          });
        }),
      ).catch((err) => {
        if (!isPropagate) TransactionUtil.rollback();
        throw err;
      });
    }

    if (!isPropagate) await TransactionUtil.commit();

    return appointment;
  }

  public async getOne(id: number): Promise<AppointmentModel> {
    return super.getOne({
      where: {
        id,
      },
      include: [
        { model: UserModel, as: 'patient' },
        DiagnosisModel,
        VaccineModel,
        UziModel,
        DopplerModel,
      ],
    });
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

    return await this.getOne(models[0].id);
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

    const uzi = (
      await AppointmentUziModel.findAll({
        where: {
          appointment_id: model.id,
        },
      })
    ).map((el) => el.uzi_id);

    const vaccine = (
      await AppointmentVaccineModel.findAll({
        where: {
          appointment_id: model.id,
        },
      })
    ).map((el) => el.vaccine_id);

    await model.destroy(TransactionUtil.getHost());

    //Remove dependencies

    await DiagnosisModel.destroy({
      where: {
        id: model.diagnosis_id,
      },
      ...TransactionUtil.getHost(),
    });

    await DopplerModel.destroy({
      where: {
        id: model.doppler_id,
      },
      ...TransactionUtil.getHost(),
    });

    await VaccineModel.destroy({
      where: {
        id: vaccine,
      },
      ...TransactionUtil.getHost(),
    });

    await UziModel.destroy({
      where: {
        id: uzi,
      },
      ...TransactionUtil.getHost(),
    });

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

  async updateVaccine(vaccineDto: VaccineUpdateDto): Promise<VaccineModel> {
    const vaccineModel = await VaccineModel.findOne({
      where: {
        id: vaccineDto.id,
      },
    });

    if (!vaccineModel) {
      throw new ModelNotFoundException(VaccineModel, vaccineDto.id);
    }

    await vaccineModel.update({ ...vaccineDto });

    return vaccineModel;
  }

  async updateUzi(uziDto: UziUpdateDto): Promise<UziModel> {
    const uziModel = await UziModel.findOne({
      where: {
        id: uziDto.id,
      },
    });

    if (!uziModel) {
      throw new ModelNotFoundException(UziModel, uziDto.id);
    }

    await uziModel.update({ ...uziDto });

    return uziModel;
  }

  async updateDoppler(dopplerDto: DopplerUpdateDto): Promise<DopplerModel> {
    const dopplerModel = await DopplerModel.findOne({
      where: {
        id: dopplerDto.id,
      },
    });

    if (!dopplerModel) {
      throw new ModelNotFoundException(DopplerModel, dopplerDto.id);
    }

    await dopplerModel.update({ ...dopplerDto });

    return dopplerModel;
  }

  async updateDiagnosis(
    diagnosisDto: DiagnosisUpdateDto,
  ): Promise<DiagnosisModel> {
    const diagnosisModel = await DiagnosisModel.findOne({
      where: {
        id: diagnosisDto.id,
      },
    });

    if (!diagnosisModel) {
      throw new ModelNotFoundException(DiagnosisModel, diagnosisDto.id);
    }

    await diagnosisModel.update({ ...diagnosisDto });

    return diagnosisModel;
  }

  async removeVaccine(id: number): Promise<void> {
    const model = await VaccineModel.findOne({
      where: {
        id,
      },
    });

    if (!model) throw new ModelNotFoundException(VaccineModel, id);

    await model.destroy();
  }

  async removeUzi(id: number) {
    const model = await UziModel.findOne({
      where: {
        id,
      },
    });

    if (!model) throw new ModelNotFoundException(UziModel, id);

    await model.destroy();
  }
}

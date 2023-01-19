import { Injectable } from "@nestjs/common";
import { AppointmentModel } from "../models/appointment.model";
import { BaseService } from "../../base/base.service";
import { AppointmentCreateDto } from "../dtos/appointment-create.dto";
import { AppointmentUpdateDto } from "../dtos/appointment-update.dto";

@Injectable()
export class AppointmentService extends BaseService<AppointmentModel> {
  constructor() {
    super(AppointmentModel);
  }
  public async create(createDto: AppointmentCreateDto): Promise<AppointmentModel> {
    console.log(createDto)
    return AppointmentModel.create();
  }

  public async update(updateDto: AppointmentUpdateDto): Promise<AppointmentModel> {
    console.log(updateDto)
    return AppointmentModel.create();
  }
}

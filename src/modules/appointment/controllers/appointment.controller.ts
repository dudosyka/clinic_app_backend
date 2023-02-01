import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import {
  ResponseFilter,
  ResponseStatus,
} from '../../../filters/response.filter';
import { AppointmentModel } from '../models/appointment.model';
import { AppointmentService } from '../services/appointment.service';
import { AppointmentCreateDto } from '../dtos/appointment-create.dto';
import { AppointmentUpdateDto } from '../dtos/appointment-update.dto';
import { VaccineModel } from '../models/vaccine.model';
import { VaccineUpdateDto } from '../dtos/vaccine-update.dto';
import { UziUpdateDto } from '../dtos/uzi-update.dto';
import { UziModel } from '../models/uzi.model';
import { DopplerUpdateDto } from '../dtos/doppler-update.dto';
import { DopplerModel } from '../models/doppler.model';
import { DiagnosisUpdateDto } from '../dtos/diagnosis-update.dto';
import { DiagnosisModel } from '../models/diagnosis.model';
import {AppointmentFilterDto} from "../dtos/appointment-filter.dto";

@Controller('appointment')
@UseGuards(JwtAuthGuard)
export class AppointmentController {
  constructor(
    @Inject(AppointmentService) private appointmentService: AppointmentService,
  ) {}

  @Post('/all')
  @HttpCode(ResponseStatus.SUCCESS)
  public async getAll(
      @Body('filters') filters: AppointmentFilterDto
  ): Promise<ResponseFilter<AppointmentModel[]>> {
    return ResponseFilter.response<AppointmentModel[]>(
      await this.appointmentService.getAll(filters),
      ResponseStatus.SUCCESS,
    );
  }

  @Get('/last/:patient_id')
  @HttpCode(ResponseStatus.SUCCESS)
  public async getLast(
    @Param('patient_id') patient_id: number,
  ): Promise<ResponseFilter<AppointmentModel>> {
    return ResponseFilter.response<AppointmentModel>(
      await this.appointmentService.getLast(patient_id),
      ResponseStatus.SUCCESS,
    );
  }

  @Get(':id')
  @HttpCode(ResponseStatus.SUCCESS)
  public async getOne(
    @Param('id') id: number,
  ): Promise<ResponseFilter<AppointmentModel>> | never {
    return ResponseFilter.response<AppointmentModel>(
      await this.appointmentService.getOne(id),
      ResponseStatus.SUCCESS,
    );
  }

  @Post('')
  @HttpCode(ResponseStatus.CREATED)
  public async create(
    @Req() req,
    @Body() createDto: AppointmentCreateDto,
  ): Promise<ResponseFilter<AppointmentModel>> | never {
    console.log(req.user);
    createDto.doctor_id = req.user.id;
    return ResponseFilter.response<AppointmentModel>(
      await this.appointmentService.create(createDto),
      ResponseStatus.CREATED,
    );
  }

  @Patch()
  @HttpCode(ResponseStatus.SUCCESS)
  public async update(
    @Body() updateDto: AppointmentUpdateDto,
  ): Promise<ResponseFilter<AppointmentModel>> | never {
    return ResponseFilter.response<AppointmentModel>(
      await this.appointmentService.update(updateDto),
      ResponseStatus.SUCCESS,
    );
  }

  @Delete(':id')
  @HttpCode(ResponseStatus.NO_CONTENT)
  public async remove(@Param('id') id: number): Promise<ResponseFilter<void>> {
    return ResponseFilter.response<void>(
      await this.appointmentService.remove(id),
      ResponseStatus.NO_CONTENT,
    );
  }

  @Patch('/vaccine')
  @HttpCode(ResponseStatus.SUCCESS)
  public async updateVaccine(
    @Body() vaccineDto: VaccineUpdateDto,
  ): Promise<ResponseFilter<VaccineModel>> | never {
    return ResponseFilter.response<VaccineModel>(
      await this.appointmentService.updateVaccine(vaccineDto),
      ResponseStatus.SUCCESS,
    );
  }

  @Patch('/uzi')
  @HttpCode(ResponseStatus.SUCCESS)
  public async updateUzi(
    @Body() uziDto: UziUpdateDto,
  ): Promise<ResponseFilter<UziModel>> | never {
    return ResponseFilter.response<UziModel>(
      await this.appointmentService.updateUzi(uziDto),
      ResponseStatus.SUCCESS,
    );
  }

  @Patch('/doppler')
  @HttpCode(ResponseStatus.SUCCESS)
  public async updateDoppler(
    @Body() dopplerDto: DopplerUpdateDto,
  ): Promise<ResponseFilter<DopplerModel>> | never {
    return ResponseFilter.response<DopplerModel>(
      await this.appointmentService.updateDoppler(dopplerDto),
      ResponseStatus.SUCCESS,
    );
  }

  @Patch('/diagnosis')
  @HttpCode(ResponseStatus.SUCCESS)
  public async updateDiagnosis(
    @Body() diagnosisDto: DiagnosisUpdateDto,
  ): Promise<ResponseFilter<DiagnosisModel>> | never {
    return ResponseFilter.response<DiagnosisModel>(
      await this.appointmentService.updateDiagnosis(diagnosisDto),
      ResponseStatus.SUCCESS,
    );
  }

  @Delete('/vaccine/:id')
  @HttpCode(ResponseStatus.NO_CONTENT)
  public async removeVaccine(
    @Param('id') id: number,
  ): Promise<ResponseFilter<void>> | never {
    return ResponseFilter.response<void>(
      await this.appointmentService.removeVaccine(id),
      ResponseStatus.NO_CONTENT,
    );
  }

  @Delete('/uzi/:id')
  @HttpCode(ResponseStatus.NO_CONTENT)
  public async removeUzi(
    @Param('id') id: number,
  ): Promise<ResponseFilter<void>> | never {
    return ResponseFilter.response<void>(
      await this.appointmentService.removeUzi(id),
      ResponseStatus.NO_CONTENT,
    );
  }
}

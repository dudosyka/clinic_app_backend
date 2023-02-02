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
  Req, UploadedFile,
  UseGuards, UseInterceptors,
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
import {AppointmentFilterDto} from "../dtos/appointment-filter.dto";
import {FileInterceptor} from "@nestjs/platform-express";

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

  @Post('/:userId/file/upload')
  @HttpCode(ResponseStatus.NO_CONTENT)
  @UseInterceptors(FileInterceptor('file'))
  public async uploadFile(
      @Param("userId") userId: number,
      @UploadedFile() file: Express.Multer.File
  ) {
    await this.appointmentService.uploadFile(userId, file).catch(err => {
      throw err;
    });
  }

  @Get('file/:id/read')
  @HttpCode(ResponseStatus.SUCCESS)
  public async readFile(
      @Param('id') fileId: number,
  ) {
    return await this.appointmentService.getFileStream(fileId);
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
    return ResponseFilter.response<{ id, is_first, patient, doctor, value }>(
      await this.appointmentService._getOne(id),
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
}

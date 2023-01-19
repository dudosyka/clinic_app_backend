import { Body, Controller, Get, HttpCode, Inject, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../guards/jwt-auth.guard";
import { ResponseFilter, ResponseStatus } from "../../../filters/response.filter";
import { AppointmentModel } from "../models/appointment.model";
import { AppointmentService } from "../services/appointment.service";
import { AppointmentCreateDto } from "../dtos/appointment-create.dto";
import { AppointmentUpdateDto } from "../dtos/appointment-update.dto";

@Controller("appointment")
@UseGuards(JwtAuthGuard)
export class AppointmentController {

  constructor(
    @Inject(AppointmentService) private appointmentService: AppointmentService
  ) {
  }

  @Get("")
  @HttpCode(ResponseStatus.SUCCESS)
  public async getAll(): Promise<ResponseFilter<AppointmentModel[]>> {
    return ResponseFilter.response<AppointmentModel[]>(await this.appointmentService.getAll(), ResponseStatus.SUCCESS);
  }

  @Get(":id")
  @HttpCode(ResponseStatus.SUCCESS)
  public async getOne(@Param("id") id: number): Promise<ResponseFilter<AppointmentModel>> | never {
    return ResponseFilter.response<AppointmentModel>(await this.appointmentService.getOne({ where: { id } }), ResponseStatus.SUCCESS);
  }

  @Post("")
  @HttpCode(ResponseStatus.CREATED)
  public async create(@Body() createDto: AppointmentCreateDto): Promise<ResponseFilter<AppointmentModel>> | never {
    return ResponseFilter.response<AppointmentModel>(await this.appointmentService.create(createDto), ResponseStatus.CREATED);
  }

  @Patch()
  @HttpCode(ResponseStatus.SUCCESS)
  public async update(@Body() updateDto: AppointmentUpdateDto): Promise<ResponseFilter<AppointmentModel>> | never {
    return ResponseFilter.response<AppointmentModel>(await this.appointmentService.update(updateDto), ResponseStatus.SUCCESS);
  }
}

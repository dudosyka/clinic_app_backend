import { Controller, Get, HttpCode, Inject, Param } from "@nestjs/common";
import { ReferencesService } from "../services/references.service";
import { ResponseFilter, ResponseStatus } from "../../../filters/response.filter";
import { Model } from "sequelize-typescript";

@Controller('reference')
export class ReferencesController {
  constructor(
    @Inject(ReferencesService) private referencesService: ReferencesService
  ) {}

  @Get('instances')
  @HttpCode(ResponseStatus.SUCCESS)
  public async getInstancesList(): Promise<ResponseFilter<any>> {
    return ResponseFilter.response<any>(this.referencesService.getInstancesList(), ResponseStatus.SUCCESS);
  }

  @Get(":modelName")
  @HttpCode(ResponseStatus.SUCCESS)
  public async getAll(@Param('modelName') modelName: string): Promise<ResponseFilter<Model[]>> {
    return ResponseFilter.response<Model[]>(await this.referencesService.getAll(modelName), ResponseStatus.SUCCESS);
  }

  @Get(":modelName/:id")
  @HttpCode(ResponseStatus.SUCCESS)
  public async getOne(@Param('modelName') modelName: string, @Param('id') id: number): Promise<ResponseFilter<Model>> {
    return ResponseFilter.response<Model>(await this.referencesService.getOne(modelName, id), ResponseStatus.SUCCESS)
  }
}

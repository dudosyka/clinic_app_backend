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
  Request,
  UseGuards
} from "@nestjs/common";
import { LocalAuthGuard } from "../../../guards/local-auth.guard";
import { AuthService } from "../services/auth.service";
import { ResponseFilter, ResponseStatus } from "../../../filters/response.filter";
import { UserModel } from "../models/user.model";
import { UserService } from "../services/user.service";
import { UserRole } from "../../../confs/main.conf";
import { UserCreateDto } from "../dtos/user-create.dto";
import { UserUpdateDto } from "../dtos/user-update.dto";
import { JwtAuthGuard } from "../../../guards/jwt-auth.guard";

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    @Inject(AuthService) private authService: AuthService,
    @Inject(UserService) private userService: UserService
  ) {
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(ResponseStatus.SUCCESS)
  public async login(@Request() req) {
    return ResponseFilter.response<string>(await this.authService.signUser(req.user), ResponseStatus.SUCCESS);
  }

  @Get('genhash/:str')
  @HttpCode(ResponseStatus.SUCCESS)
  public async generateHash(@Param('str') str: string): Promise<ResponseFilter<string>> {
    return ResponseFilter.response<string>(await this.authService.generateHash(str), ResponseStatus.SUCCESS);
  }

  @Post('/')
  @HttpCode(ResponseStatus.CREATED)
  public async create(@Body() createDto: UserCreateDto): Promise<ResponseFilter<UserModel>> {
    return ResponseFilter.response<UserModel>(await this.userService.create(createDto), ResponseStatus.CREATED)
  }

  @Get("/")
  @HttpCode(ResponseStatus.SUCCESS)
  public async getAll(): Promise<ResponseFilter<UserModel[]>> {
    return ResponseFilter.response<UserModel[]>(await this.userService.getAll(), ResponseStatus.SUCCESS)
  }

  @Get("/role/:role")
  @HttpCode(ResponseStatus.SUCCESS)
  public async getByRole(@Param("role") role: UserRole): Promise<ResponseFilter<UserModel[]>> {
    return ResponseFilter.response<UserModel[]>(await this.userService.getAll({ role }), ResponseStatus.SUCCESS)
  }

  @Get(":id")
  @HttpCode(ResponseStatus.SUCCESS)
  public async getOne(@Param("id") id: number): Promise<ResponseFilter<UserModel>> {
    return ResponseFilter.response<UserModel>(await this.userService.getOne({ where: { id } }), ResponseStatus.SUCCESS)
  }

  @Patch("")
  @HttpCode(ResponseStatus.SUCCESS)
  public async update(@Body() update: UserUpdateDto): Promise<ResponseFilter<UserModel>> {
    return ResponseFilter.response<UserModel>(await this.userService.update(update), ResponseStatus.SUCCESS);
  }

  @Delete(":id")
  @HttpCode(ResponseStatus.NO_CONTENT)
  public async remove(@Param("id") id: number): Promise<ResponseFilter<boolean>> {
    return ResponseFilter.response<boolean>(await this.userService.remove({ where: { id } }), ResponseStatus.NO_CONTENT);
  }
}

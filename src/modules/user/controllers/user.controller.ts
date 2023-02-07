import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post, Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { LocalAuthGuard } from '../../../guards/local-auth.guard';
import { AuthService } from '../services/auth.service';
import {
  ResponseFilter,
  ResponseStatus,
} from '../../../filters/response.filter';
import { UserModel } from '../models/user.model';
import { UserService } from '../services/user.service';
import { UserCreateDto } from '../dtos/user-create.dto';
import { UserUpdateDto } from '../dtos/user-update.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { UserFilterDto } from '../dtos/user-filter.dto';
import {AdminGuard} from "../../../guards/admin.guard";
import {AdminSetupDto} from "../dtos/admin-setup.dto";

@Controller('user')
export class UserController {
  constructor(
    @Inject(AuthService) private authService: AuthService,
    @Inject(UserService) private userService: UserService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(ResponseStatus.SUCCESS)
  public async login(@Request() req) {
    return ResponseFilter.response<{ token: string, model: UserModel }>(
      await this.authService.signUser(req.user),
      ResponseStatus.SUCCESS,
    );
  }

  @Get('setup')
  @HttpCode(ResponseStatus.SUCCESS)
  public async checkAdmins(): Promise<ResponseFilter<void>> {
    return ResponseFilter.response(await this.userService.checkAdmins(), ResponseStatus.SUCCESS)
  }

  @Post('setup')
  @HttpCode(ResponseStatus.SUCCESS)
  public async setup(
      @Body() adminSetup: AdminSetupDto
  ) {
    return ResponseFilter.response(await this.userService.adminSetup(adminSetup), ResponseStatus.SUCCESS)
  }

  @Get('setup/:key')
  @HttpCode(ResponseStatus.SUCCESS)
  public async setupKey(
      @Param('key') key: string
  ) {
    return ResponseFilter.response(await this.userService.adminSetupCheck(key), ResponseStatus.SUCCESS)
  }

  @Get('genhash/:str')
  @HttpCode(ResponseStatus.SUCCESS)
  public async generateHash(
    @Param('str') str: string,
  ): Promise<ResponseFilter<string>> {
    return ResponseFilter.response<string>(
      await this.authService.generateHash(str),
      ResponseStatus.SUCCESS,
    );
  }

  @Post('/')
  @UseGuards(JwtAuthGuard)
  @HttpCode(ResponseStatus.CREATED)
  public async create(
    @Body() createDto: UserCreateDto,
  ): Promise<ResponseFilter<UserModel>> {
    return ResponseFilter.response<UserModel>(
      await this.userService.create(createDto),
      ResponseStatus.CREATED,
    );
  }

  @Post('/all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(ResponseStatus.SUCCESS)
  public async getAll(
      @Body('filters') filters: UserFilterDto
  ): Promise<ResponseFilter<UserModel[]>> {
    return ResponseFilter.response<UserModel[]>(
      await this.userService.getAll(filters),
      ResponseStatus.SUCCESS,
    );
  }

  @Get('/current')
  @UseGuards(JwtAuthGuard)
  @HttpCode(ResponseStatus.SUCCESS)
  public async getByToken(
    @Req() req: any,
  ): Promise<ResponseFilter<UserModel>> {
    return ResponseFilter.response<UserModel>(
      await this.userService.getOne({ where: { id: req.user.id } }),
      ResponseStatus.SUCCESS,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(ResponseStatus.SUCCESS)
  public async getOne(
    @Param('id') id: number,
  ): Promise<ResponseFilter<UserModel>> {
    return ResponseFilter.response<UserModel>(
      await this.userService.getOne({ where: { id } }),
      ResponseStatus.SUCCESS,
    );
  }

  @Patch('')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(ResponseStatus.SUCCESS)
  public async update(
    @Body() update: UserUpdateDto,
  ): Promise<ResponseFilter<UserModel>> {
    return ResponseFilter.response<UserModel>(
      await this.userService.update(update),
      ResponseStatus.SUCCESS,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(ResponseStatus.NO_CONTENT)
  public async remove(
      @Param('id') id: number
  ): Promise<ResponseFilter<void>> {
    return ResponseFilter.response<void>(
      await this.userService.delete(id),
      ResponseStatus.NO_CONTENT,
    );
  }
}

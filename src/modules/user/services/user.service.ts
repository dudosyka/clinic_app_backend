import { UserCreateDto } from '../dtos/user-create.dto';
import { UserModel } from '../models/user.model';
import { UserRole } from '../../../confs/main.conf';
import { BadRequestException } from '../../../exceptions/bad-request.exception';
import { Inject } from '@nestjs/common';
import { AuthService } from './auth.service';
import { BaseService } from '../../base/base.service';
import { UserUpdateDto } from '../dtos/user-update.dto';

export class UserService extends BaseService<UserModel> {
  constructor(@Inject(AuthService) private authService: AuthService) {
    super(UserModel);
  }

  public async create(create: UserCreateDto): Promise<UserModel> | never {
    if (create.role == UserRole.Doctor || create.role == UserRole.Patient) {
      let hash = '-';
      if (create.password)
        hash = await this.authService.generateHash(create.password);

      let login = create.login;
      if (!create.login) login = `user_${Date.now()}`;

      return UserModel.create({ ...create, hash, login });
    }

    throw new BadRequestException('user.role invalid');
  }

  public async getAll(query: any = null): Promise<UserModel[]> {
    if (query)
      return super.getAll({
        where: {
          ...query,
        },
      });
    else return super.getAll();
  }

  public async update(update: UserUpdateDto): Promise<UserModel> | never {
    const userModel: UserModel = await this.getOne({
      where: { id: update.id },
    });

    if (update.password)
      update.password = await this.authService.generateHash(update.password);

    await userModel.update(update);

    return userModel;
  }
}

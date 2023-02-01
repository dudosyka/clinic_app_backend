import { UserCreateDto } from '../dtos/user-create.dto';
import { UserModel } from '../models/user.model';
import mainConf, { UserRole } from '../../../confs/main.conf';
import { BadRequestException } from '../../../exceptions/bad-request.exception';
import { Inject } from '@nestjs/common';
import { AuthService } from './auth.service';
import { BaseService } from '../../base/base.service';
import { UserUpdateDto } from '../dtos/user-update.dto';
import {Op} from "sequelize";

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

      const checkUnique = await UserModel.findOne({
        where: {
          login
        }
      });

      if (checkUnique)
        throw new BadRequestException("Login must be unique")

      return UserModel.create({ ...create, hash, login });
    }

    throw new BadRequestException('user.role invalid');
  }

  public async getAll(query: any = null): Promise<UserModel[]> {
    if (!query) {
      let page = 1;
      return super.getAll({
        arguments: ["id", "name", "surname", "lastname", "birthday"],
        offset: (page-1)*mainConf.limit,
        limit: page* mainConf.limit,
        order: [['id', 'DESC']],
      });

    }
    let where: any = {};
    if (query.fullName) {
      const patientFullname = query.fullName.split(" ");
      where = {
        surname: {
          [Op.like]: `%${patientFullname[0]}%`
        },
        name: {
          [Op.like]: `%${patientFullname[1]}%`
        },
        lastname: {
          [Op.like]: `%${patientFullname[2]}%`
        }
      }
      console.log(where);
    }

    if (query.role) {
      where.role = query.role;
    }

    let page = 1;
    if (query.page)
      page = query.page


    if (query)
      return super.getAll({
        arguments: ["id", "name", "surname", "lastname", "birthday"],
        where: {
          ...where,
        },
        order: [['id', 'DESC']],
        offset: (page-1)*mainConf.limit,
        limit: page* mainConf.limit
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

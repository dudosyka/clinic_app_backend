import { UserCreateDto } from '../dtos/user-create.dto';
import { UserModel } from '../models/user.model';
import mainConf, { UserRole } from '../../../confs/main.conf';
import { BadRequestException } from '../../../exceptions/bad-request.exception';
import {ForbiddenException, Inject} from '@nestjs/common';
import { AuthService } from './auth.service';
import { BaseService } from '../../base/base.service';
import { UserUpdateDto } from '../dtos/user-update.dto';
import {Op} from "sequelize";
import {AppointmentModel} from "../../appointment/models/appointment.model";
import {UserFilterDto} from "../dtos/user-filter.dto";
import {AdminSetupDto} from "../dtos/admin-setup.dto";
import * as fs from "fs";
import * as path from "path";
import * as process from "process";

export class UserService extends BaseService<UserModel> {
  constructor(
      @Inject(AuthService) private authService: AuthService
  ) {
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

  public async getAll(query: UserFilterDto | null = null): Promise<UserModel[]> {
    if (!query) {
      let page = 1;
      return super.getAll({
        arguments: ["id", "name", "surname", "lastname", "birthday"],
        offset: (page-1)*mainConf.limit,
        limit: mainConf.limit,
        order: [['id', 'DESC']],
      });

    }

    let where: any = {};
    if (query.fullName) {
      const patientFullname = query.fullName.split(" ");
      where = {
        [Op.or]: [
          {
            surname: {
              [Op.like]: `%${patientFullname[0]}%`
            },
          },
          patientFullname.length > 1 ? {
            surname: {
              [Op.like]: `%${patientFullname[1]}%`
            },
          } : {},
          patientFullname.length > 2 ? {
            surname: {
              [Op.like]: `%${patientFullname[2]}%`
            },
          } : {},
          {
            name: {
              [Op.like]: `%${patientFullname[0]}%`
            },
          },
          patientFullname.length > 1 ? {
            name: {
              [Op.like]: `%${patientFullname[1]}%`
            },
          } : {},
          patientFullname.length > 2 ? {
            name: {
              [Op.like]: `%${patientFullname[2]}%`
            },
          } : {},
          {
            lastname: {
              [Op.like]: `%${patientFullname[0]}%`
            }
          },
          patientFullname.length > 1 ? {
            lastname: {
              [Op.like]: `%${patientFullname[1]}%`
            }
          } : {},
          patientFullname.length > 2 ? {
            lastname: {
              [Op.like]: `%${patientFullname[2]}%`
            }
          } : {}
        ]
      }
    }

    where.deleted = false;

    if (query.role || query.role == 0) {
      where.role = query.role;
    }

    let page = 1;
    if (query.page)
      page = query.page

    if (query) {
      if (query.hasAppointment === true || query.hasAppointment === false) {
        const hasFirstAppointmentUsers = (await AppointmentModel.findAll({
          attributes: ['patient_id'],
          where: {
            is_first: true
          }
        })).map(el => el.patient_id);

        if (query.hasAppointment === true) {
          where.id = hasFirstAppointmentUsers;
        } else {
          where.id = {[Op.notIn]: hasFirstAppointmentUsers}
        }
      }
      let options = {
        arguments: ["id", "name", "surname", "lastname", "birthday"],
        where: {
          ...where,
        },
        order: [['id', 'DESC']],
        offset: (page-1)*mainConf.limit,
        limit: mainConf.limit
      };
      if(query.export) {
        options.limit = 999999999;
        options.order = [['id', 'ASC']];
      }
      return await super.getAll(options);
    }
    else return super.getAll();
  }

  public async update(update: UserUpdateDto): Promise<UserModel> | never {
    const userModel: UserModel = await this.getOne({
      where: { id: update.id, deleted: false },
    });

    if (update.password)
      update.hash = await this.authService.generateHash(update.password);

    await userModel.update(update);

    return userModel;
  }

  public async delete(id: number) {
    await UserModel.update({deleted: true}, {where: {id}})
  }

  async checkAdmins(): Promise<void> | never {
    await super.getOne({
      where: {
        role: 0
      }
    })
  }

  async adminSetup(adminSetup: AdminSetupDto) {
    const checkAdmins = await UserModel.findOne({
      where: {
        role: 0
      }
    });

    const adminExists = !!(checkAdmins)

    const keyConf = fs.readFileSync(path.join(process.cwd(), 'key.conf')).toString();

    const key = keyConf.split('=')[1];

    if ( (!adminSetup.password)
    ) throw new BadRequestException("You must provide password");

    if (!adminExists && adminSetup.password) {
      await UserModel.create({
        name: "admin",
        surname: "admin",
        lastname: "admin",
        login: "admin",
        role: 0,
        hash: await this.authService.generateHash(adminSetup.password)
      })
      return;
    }

    if (!adminSetup.key || (key.length < 1)) throw new ForbiddenException()

    if (adminExists && adminSetup.key.trim() == key.trim() && adminSetup.password) {
      checkAdmins.hash = await this.authService.generateHash(adminSetup.password);
      await checkAdmins.save();
    } else {
      throw new BadRequestException("")
    }

  }

  async adminSetupCheck(inputKey: string): Promise<boolean>  {
    const keyConf = fs.readFileSync(path.join(process.cwd(), 'key.conf')).toString();

    const key = keyConf.split('=')[1].trim();
    
    return key === inputKey;
  }
}

import { UserModel } from '../models/user.model';
import { InjectModel } from '@nestjs/sequelize';
import { BcryptUtil } from '../../../utils/bcrypt.util';
import { Inject } from '@nestjs/common';
import { JwtUtil } from '../../../utils/jwt.util';
import { FailedAuthorizationException } from '../../../exceptions/failed-authorization.exception';
import { ModelNotFoundException } from '../../../exceptions/model-not-found.exception';

export class AuthService {
  constructor(
    @InjectModel(UserModel) private userModel: UserModel,
    @Inject(BcryptUtil) private bcrypt: BcryptUtil,
    @Inject(JwtUtil) private jwt: JwtUtil,
  ) {}

  public async validateCredentials(
    login: string,
    password: string,
  ): Promise<UserModel> {
    let user = await UserModel.findOne({
      where: {
        login,
      },
    });

    if (!user) throw new FailedAuthorizationException(false, true);

    const passwordCompare = await this.bcrypt
      .compare(password, user.hash)
      .then((el) => el)
      .catch(() => false);

    if (!passwordCompare) throw new FailedAuthorizationException(true, false);

    return user;
  }

  public async signUser(user: UserModel) {
    if (!user) {
      throw new ModelNotFoundException(UserModel, null);
    }

    return {
      model: user,
      token: this.jwt.signUser(user)
    };
  }

  public async generateHash(str: string = ''): Promise<string> {
    return await this.bcrypt.hash(str);
  }
}

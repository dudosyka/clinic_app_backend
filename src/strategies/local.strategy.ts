import { Strategy } from "passport-local";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../modules/user/services/auth.service";
import { UserModel } from "../modules/user/models/user.model";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: "login",
      passwordField: "password"
    });
  }

  async validate(login: string, password: string): Promise<UserModel> | never {
    const user = await this.authService.validateCredentials(login, password);

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}

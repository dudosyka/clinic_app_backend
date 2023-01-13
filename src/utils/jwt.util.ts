import { JwtService } from "@nestjs/jwt";
import { Injectable } from "@nestjs/common";
import {UserModel} from "../modules/user/models/user.model";

@Injectable()
export class JwtUtil {
  constructor(private jwtService: JwtService) {
  }

  public signUser(user: UserModel): string {
    return this.jwtService.sign({
      userId: user.id,
      role: user.role,
    });
  }
}

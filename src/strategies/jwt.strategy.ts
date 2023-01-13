import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import mainConf, {UserRole} from "../confs/main.conf";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: mainConf.jwtConstants.secret
    });
  }

  async validate(payload: { sub?: number, isAdmin?: boolean, role: UserRole, blockId?: number, week?: number, companyId?: number }) {
    return {
      id: payload.sub,
      isAdmin: payload.isAdmin,
      role: payload.role,
      blockId: payload.blockId,
      companyId: payload.companyId,
      week: payload.week
    };
  }
}

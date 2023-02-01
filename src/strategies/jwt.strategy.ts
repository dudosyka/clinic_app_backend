import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import mainConf, { UserRole } from '../confs/main.conf';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: mainConf.jwtConstants.secret,
    });
  }

  async validate(payload: { userId?: number; role: UserRole }) {
    return {
      id: payload.userId,
      role: payload.role,
    };
  }
}

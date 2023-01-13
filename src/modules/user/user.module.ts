import {Module} from "@nestjs/common";
import {SequelizeModule} from "@nestjs/sequelize";
import {UserModel} from "./models/user.model";
import {UserService} from "./services/user.service";
import {AuthService} from "./services/auth.service";
import {UserController} from "./controllers/user.controller";
import {PassportModule} from "@nestjs/passport";
import {JwtModule} from "@nestjs/jwt";
import mainConf from "../../confs/main.conf";
import {LocalStrategy} from "../../strategies/local.strategy";
import {JwtStrategy} from "../../strategies/jwt.strategy";
import { BcryptUtil } from "../../utils/bcrypt.util";
import { JwtUtil } from "../../utils/jwt.util";

@Module({
    imports: [
        SequelizeModule.forFeature([UserModel]),
        PassportModule,
        JwtModule.register({
            secret: mainConf.jwtConstants.secret,
            signOptions: { expiresIn: "100d" }
        }),
    ],
    controllers: [UserController],
    providers: [UserService, BcryptUtil, JwtUtil, AuthService, LocalStrategy, JwtStrategy]
})
export class UserModule {}

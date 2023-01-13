import { Controller, Get, HttpCode, Inject, Param, Post, Request, UseGuards } from "@nestjs/common";
import { LocalAuthGuard } from "../../../guards/local-auth.guard";
import { AuthService } from "../services/auth.service";
import { ResponseFilter, ResponseStatus } from "../../../filters/response.filter";

@Controller('user')
export class UserController {
    constructor(
        @Inject(AuthService) private authService: AuthService
    ) {
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    @HttpCode(ResponseStatus.SUCCESS)
    public async login(@Request() req) {
        return ResponseFilter.response<string>(await this.authService.signUser(req.user), ResponseStatus.SUCCESS);
    }

    @Get('genhash/:str')
    @HttpCode(ResponseStatus.SUCCESS)
    public async generateHash(@Param('str') str: string): Promise<ResponseFilter<string>> {
        return ResponseFilter.response<string>(await this.authService.generateHash(str), ResponseStatus.SUCCESS);
    }
}

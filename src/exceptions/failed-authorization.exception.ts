import { HttpException } from '@nestjs/common';

export class FailedAuthorizationException<T> extends HttpException {
  constructor(password: boolean, login: boolean) {
    const status = 403;
    let response: any = { authorization: 'failed' };

    if (password) response = { secret: 'failed' };
    if (login) response = { login: 'failed' };

    super(response, status);
  }
}

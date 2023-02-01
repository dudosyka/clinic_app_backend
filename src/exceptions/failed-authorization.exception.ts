import { HttpException } from '@nestjs/common';

export class FailedAuthorizationException<T> extends HttpException {
  constructor(password: boolean, email: boolean) {
    const status = 403;
    let response: any = { authorization: 'failed' };

    if (password) response = { secret: 'failed' };
    if (email) response = { email: 'failed' };

    super(response, status);
  }
}

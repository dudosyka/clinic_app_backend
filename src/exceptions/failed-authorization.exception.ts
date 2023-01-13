import { HttpException } from "@nestjs/common";

export class FailedAuthorizationException<T> extends HttpException {
  constructor(password: boolean, email: boolean) {
    if (password)
      super({ "password": "failed" }, 403);
    if (email)
      super({ "email": "failed" }, 403);
  }

}

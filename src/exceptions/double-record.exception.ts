import { HttpException } from "@nestjs/common";

export class DoubleRecordException<T> extends HttpException {
  constructor(model: T) {
    super({ model }, 409);
  }

}

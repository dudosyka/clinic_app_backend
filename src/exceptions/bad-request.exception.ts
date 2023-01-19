import { HttpException } from "@nestjs/common";
import { ResponseStatus } from "../filters/response.filter";

export class BadRequestException extends HttpException {
  constructor(message: string) {
    super({ message }, ResponseStatus.BAD_REQUEST);
  }
}

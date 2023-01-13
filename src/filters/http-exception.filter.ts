import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { BaseExceptionFilter } from "./base-exception.filter";

@Catch(HttpException)
export class HttpExceptionFilter extends BaseExceptionFilter implements ExceptionFilter {

  catch(exception: HttpException, host: ArgumentsHost): any {
    const response = this.log(exception, host);
    this.sendResponse(response, exception.getStatus(), {
      "type": "common",
      "error": exception.message
    });
  }
}

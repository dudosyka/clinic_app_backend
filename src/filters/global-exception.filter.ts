import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { BaseExceptionFilter } from "./base-exception.filter";

@Catch(Error)
export class GlobalExceptionFilter extends BaseExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const response = this.log(exception, host);
    this.sendResponse(response, 500, {
      "type": "unknown",
      "error": exception.message
    });
  }
}

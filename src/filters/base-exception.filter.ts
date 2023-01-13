import { ArgumentsHost, Inject } from "@nestjs/common";
import { Response } from "express";
import { LoggerService } from "../modules/logger/services/logger.service";
import { TransactionUtil } from "../utils/TransactionUtil";
import { ResponseFilter } from "./response.filter";

export class BaseExceptionFilter {
  constructor(
    @Inject(LoggerService) private loggerProvider: LoggerService
  ) {}

  log(exception: Error, host: ArgumentsHost): Response {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    if (exception.message !== "Cannot GET /favicon.ico") {
      console.error(exception)
      this.loggerProvider.log({
        message: exception.message,
        name: `${exception.name} ${request.url}`,
        stack: JSON.stringify(exception.stack.split("at").map(el => el.slice(0, el.length - 5)))
      }).then(() => {});
    }
    return response;
  }

  sendResponse(response: Response, status: number, body: any) {
    if (TransactionUtil.isSet()) {
      TransactionUtil.rollback().then(() => {
        response.status(status).contentType("json").send(JSON.stringify(ResponseFilter.response<any>(body, status)));
      });
    } else {
      response.status(status).contentType("json").send(JSON.stringify(ResponseFilter.response<any>(body, status)));
    }
  }
}

import { ArgumentsHost, BadRequestException, Catch, ExceptionFilter } from "@nestjs/common";
import { BaseExceptionFilter } from "./base-exception.filter";

@Catch(BadRequestException)
export class ValidationExceptionFilter extends BaseExceptionFilter implements ExceptionFilter {

  private formatObject(key, value) {
    console.log(key);
    let arrKey = key.split('.');
    if (arrKey.length == 1)
      return { [key]: value };
    else {
      return {
        [arrKey[arrKey.length - 1]]: this.formatObject(arrKey.filter((el, key) => key != arrKey.length - 1).join('.'), value)
      }
    }
  }

  private formatString(str) {
    const split = str.split('.');
    if (split.length == 1) {
        return {
          [split[0].split(" ")[0]]: split[0].split(" ").filter((el, key) => key != 0).join(" ")
        };
    } else {
        let key = split[split.length - 1].split(" ")[0] + "." + split.filter((el, key) => key < split.length - 1).reverse().join('.');
        let value = split[split.length - 1].split(" ").filter((el, key) => key != 0).join(" ")
        return this.formatObject(key, value)
    }
  }

  catch(exception: BadRequestException, host: ArgumentsHost): any {
    const response = this.log(exception, host);
    let err: any = [ exception.message ];

    if (typeof exception.getResponse() != 'string') {
      let message = [];
      Object.keys(exception.getResponse()).map(el => {
        if (el == 'message')
          message = exception.getResponse()[el];
      })
      err = message.map(el => {
        return this.formatString(el);
      });
    }

    this.sendResponse(response, exception.getStatus(), {
      "type": "common",
      "error": err
    });
  }
}

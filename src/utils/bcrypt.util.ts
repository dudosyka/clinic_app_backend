import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BcryptUtil {
  public hash(str: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      bcrypt.genSalt(10, (err, salt) => {
        if (err) {
          reject(err);
        }
        bcrypt.hash(str, salt, (err, res) => {
          if (err) {
            reject(err);
          }
          resolve(res);
        });
      });
    });
  }

  public compare(str: string, hash: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      bcrypt.compare(str, hash, (err, ok) => {
        if (!ok) reject(err);
        resolve(ok);
      });
    });
  }
}

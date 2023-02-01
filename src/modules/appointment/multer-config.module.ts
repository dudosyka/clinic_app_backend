import {MulterModuleOptions, MulterOptionsFactory} from "@nestjs/platform-express";
import {diskStorage,MulterError} from "multer";

export class MulterConfigModule implements MulterOptionsFactory {
    createMulterOptions(): Promise<MulterModuleOptions> | MulterModuleOptions {
        return {
            storage: diskStorage({
                destination: './upload',
                filename(req, file: Express.Multer.File, callback: (error: (Error | null), filename: string) => void) {
                    try {
                        const name = `${file.originalname}${Date.now()}.${file.originalname.split('.')[file.originalname.split('.').length - 1]}`
                        callback(null, name)
                    } catch (e) {
                        callback(e, null);
                    }
                }
            })
        }
    }
}
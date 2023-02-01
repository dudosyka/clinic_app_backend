import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import mainConf, { ProjectState } from './confs/main.conf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  await app.listen(
    mainConf.isDev == ProjectState.DEV ? mainConf.devPort : mainConf.prodPort,
  );
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readFileSync } from 'fs';

async function bootstrap() {
  const httpsOptions = {
    key: readFileSync('./secrets/rpc.saas3.io.key'),
    cert: readFileSync('./secrets/rpc.saas3.io_bundle.crt'),
  };
  const app = await NestFactory.create(AppModule, { httpsOptions });
  app.enableCors();
  await app.listen(3001);
  console.log(`Composer is running on: ${await app.getUrl()}`);
}

bootstrap();

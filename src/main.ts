import { NestFactory } from '@nestjs/core';
import { AppModule } from './model/app.module';
import { readFileSync, existsSync } from 'fs';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
async function bootstrap() {
  const isExistsKey = existsSync('./secrets/rpc.saas3.io.key');

  const app = await NestFactory.create(
    AppModule,
    isExistsKey
      ? {
          httpsOptions: {
            key: readFileSync('./secrets/rpc.saas3.io.key'),
            cert: readFileSync('./secrets/rpc.saas3.io_bundle.crt'),
          },
        }
      : {},
  );
  //const app = await NestFactory.create(AppModule, {});
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Oracle Launchpad API')
    .setDescription('The Launchpad API description')
    .setVersion('0.0.4')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('6DD66AB8-299A-4731-B5F1-E5298F3ABF71', app, document);

  await app.listen(3001);
  console.log(`Composer is running on: ${await app.getUrl()}`);
}

bootstrap();

import { Module } from '@nestjs/common';
import { DapiService } from './dapi.service';
import { DapiController } from './dapi.controller';
import { EventsGateway } from './events.gateway';
import { ConfigModule } from '@nestjs/config';
import { DapiModule } from './model/dapi/dapi.module';
import envConfig from './env';

@Module({
  imports: [
    DapiModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [envConfig.path]
    }),
  ],
  controllers: [DapiController],
  providers: [DapiService, EventsGateway],
})
export class AppModule {}

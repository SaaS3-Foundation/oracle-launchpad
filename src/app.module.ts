import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DapiService } from './dapi.service';
import { DapiController } from './dapi.controller';

@Module({
  imports: [],
  controllers: [AppController, DapiController],
  providers: [AppService, DapiService],
})
export class AppModule {}

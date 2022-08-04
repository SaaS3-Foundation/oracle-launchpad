import { Module } from '@nestjs/common';
import { DapiService } from './dapi.service';
import { DapiController } from './dapi.controller';
import { EventsGateway } from './events.gateway';

@Module({
  imports: [],
  controllers: [DapiController],
  providers: [DapiService, EventsGateway],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { DapiService } from './dapi.service';
import { DapiController } from './dapi.controller';

@Module({
  imports: [],
  controllers: [DapiController],
  providers: [DapiService],
})
export class AppModule {}

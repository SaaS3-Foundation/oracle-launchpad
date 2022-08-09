import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { dapiProviders } from './dapi.providers';
import { DapiRepository } from './dapi.respository';

@Module({
  imports: [DatabaseModule],
  providers: [
    ...dapiProviders,
    DapiRepository,
  ],
  exports: [DapiRepository],
})
export class DapiModule {}
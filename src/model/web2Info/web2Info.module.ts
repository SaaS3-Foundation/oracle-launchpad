import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { WEB2INFOProviders } from './web2Info.providers';
import { Web2InfoRepository } from './web2Info.respository';

@Module({
  imports: [DatabaseModule],
  providers: [...WEB2INFOProviders, Web2InfoRepository],
  exports: [Web2InfoRepository],
})
export class Web2InfoModule {}

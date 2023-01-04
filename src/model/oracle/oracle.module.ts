import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { OracleProviders } from './oracle.providers';
import { OracleRepository } from './oracle.respository';

@Module({
  imports: [DatabaseModule],
  providers: [...OracleProviders, OracleRepository],
  exports: [OracleRepository],
})
export class OracleModule {}

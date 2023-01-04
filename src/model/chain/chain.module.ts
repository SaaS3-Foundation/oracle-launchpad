import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { ChainProviders } from './chain.providers';
import { ChainRepository } from './chain.respository';

@Module({
  imports: [DatabaseModule],
  providers: [...ChainProviders, ChainRepository],
  exports: [ChainRepository],
})
export class ChainModule {}

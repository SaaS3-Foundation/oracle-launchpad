import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { faucetProviders } from './faucet.providers';
import { FaucetRepository } from './faucet.respository';

@Module({
  imports: [DatabaseModule],
  providers: [...faucetProviders, FaucetRepository],
  exports: [FaucetRepository],
})
export class FaucetModule {}

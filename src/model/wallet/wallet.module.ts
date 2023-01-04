import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { WalletProviders } from './wallet.providers';
import { WalletRepository } from './wallet.respository';

@Module({
  imports: [DatabaseModule],
  providers: [...WalletProviders, WalletRepository],
  exports: [WalletRepository],
})
export class WalletModule {}

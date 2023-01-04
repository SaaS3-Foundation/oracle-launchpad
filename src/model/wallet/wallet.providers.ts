import { DataSource } from 'typeorm';
import { WalletEntity } from './wallet.entity';

export const WalletProviders = [
  {
    provide: 'WALLET_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(WalletEntity),
    inject: ['PG_SOURCE'],
  },
];

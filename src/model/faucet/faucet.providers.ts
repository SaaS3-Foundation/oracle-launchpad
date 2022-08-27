import { DataSource } from 'typeorm';
import { FaucetEntity } from './faucet.entity';

export const faucetProviders = [
  {
    provide: 'FAUCET_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(FaucetEntity),
    inject: ['PG_SOURCE'],
  },
];

import { DataSource } from 'typeorm';
import { ChainEntity } from './chain.entity';

export const ChainProviders = [
  {
    provide: 'CHAIN_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(ChainEntity),
    inject: ['PG_SOURCE'],
  },
];

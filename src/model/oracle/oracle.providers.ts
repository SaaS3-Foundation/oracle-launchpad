import { DataSource } from 'typeorm';
import { OracleEntity } from './oracle.entity';

export const OracleProviders = [
  {
    provide: 'ORACLE_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(OracleEntity),
    inject: ['PG_SOURCE'],
  },
];

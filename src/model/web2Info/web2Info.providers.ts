import { DataSource } from 'typeorm';
import { Web2InfoEntity } from './web2Info.entity';

export const WEB2INFOProviders = [
  {
    provide: 'WEB2INFO_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Web2InfoEntity),
    inject: ['PG_SOURCE'],
  },
];

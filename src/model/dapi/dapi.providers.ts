
import { DataSource } from 'typeorm';
import { DapiEntity } from './dapi.entity';

export const dapiProviders = [
  {
    provide: 'DAPI_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(DapiEntity),
    inject: ['PG_SOURCE'],
  },
];
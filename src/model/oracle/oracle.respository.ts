import { Injectable, Inject } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Web2InfoEntity } from '../web2Info/web2Info.entity';
import { OracleEntity } from './oracle.entity';

@Injectable()
export class OracleRepository {
  constructor(
    @Inject('ORACLE_REPOSITORY')
    private readonly repo: Repository<OracleEntity>,
    @Inject('PG_SOURCE')
    private dataSource: DataSource,
  ) {}

  async findAll(): Promise<OracleEntity[]> {
    return this.repo.find({ relations: ['oracles'] });
  }

  async count(): Promise<number> {
    return this.repo.count();
  }

  async update(entity: OracleEntity): Promise<any> {
    entity.update_at = new Date();
    return this.repo.update({ id: entity.id }, entity);
  }

  async save(entity: OracleEntity): Promise<OracleEntity> {
    return this.repo.save(entity);
  }

  async deleteById(id: string) {
    return this.repo.delete({ id: id });
  }
}

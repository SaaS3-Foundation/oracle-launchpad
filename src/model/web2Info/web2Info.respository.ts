import { Injectable, Inject } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Web2InfoEntity } from './web2Info.entity';

@Injectable()
export class Web2InfoRepository {
  constructor(
    @Inject('WEB2INFO_REPOSITORY')
    private readonly repo: Repository<Web2InfoEntity>,
    @Inject('PG_SOURCE')
    private dataSource: DataSource,
  ) {}

  async count(): Promise<number> {
    return this.repo.count();
  }

  async update(entity: Web2InfoEntity): Promise<any> {
    entity.update_at = new Date();
    return this.repo.update({ id: entity.id }, entity);
  }

  // @Transaction()
  async save(entity: Web2InfoEntity): Promise<Web2InfoEntity> {
    return this.repo.save(entity);
  }

  async deleteById(id: string) {
    return this.repo.delete({ id: id });
  }
}

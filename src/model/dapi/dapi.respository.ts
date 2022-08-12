import { Injectable, Inject } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { DapiEntity } from './dapi.entity';

@Injectable()
export class DapiRepository {
  constructor(
    @Inject('DAPI_REPOSITORY')
    private readonly repo: Repository<DapiEntity>,
    @Inject('PG_SOURCE')
    private dataSource: DataSource,
  ) {}

  async page(index: number, size: number): Promise<any> {
    let data = await this.dataSource
      .getRepository(DapiEntity)
      .createQueryBuilder('dapi')
      .where({ status: 9 })
      .orderBy('dapi.create_at', 'DESC')
      .take(size)
      .skip((index - 1) * size)
      .getMany();

    let count = await this.dataSource
      .getRepository(DapiEntity)
      .createQueryBuilder('dapi')
      .where({ status: 9 })
      .getCount();

    return {
      size: size,
      page: index,
      count: data.length,
      list: data,
      total: count,
      all: count / size + (count % size > 0 ? 1 : 0),
    };
  }

  async findAll(): Promise<DapiEntity[]> {
    return this.repo.find();
  }

  async count(): Promise<number> {
    return this.repo.count();
  }

  async find(id: string): Promise<DapiEntity> {
    return this.dataSource
      .getRepository(DapiEntity)
      .createQueryBuilder('dapi')
      .where({ id: id })
      .getOne();
  }

  async save(entity: DapiEntity): Promise<DapiEntity> {
    return this.repo.save(entity);
  }

  async updateStatus(id: string, status: number) {
    let res = await this.dataSource
      .getRepository(DapiEntity)
      .update({ id: id }, { status: status });
    if (res.affected) {
      console.log('update status success');
    } else {
      console.log('update status failed');
    }
  }

  async deleteById(id: string) {
    return this.repo.delete({ id: id });
  }
}

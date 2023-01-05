import { Injectable, Inject } from '@nestjs/common';
import { DataSource, ILike, Repository } from 'typeorm';
// import { ChainRepository } from '../chain/chain.respository';
import { DapiEntity } from './dapi.entity';
import { JobStatus } from './types';

@Injectable()
export class DapiRepository {
  constructor(
    @Inject('DAPI_REPOSITORY')
    private readonly dapiRepo: Repository<DapiEntity>,
    @Inject('PG_SOURCE')
    private dataSource: DataSource,
  ) {}

  async page(index: number, size: number, searchValue: string) {
    const where = {
      status: JobStatus.DONE,
      oracleInfo: {
        title: ILike(`%${searchValue}%`),
      },
    };
    const data = await this.dapiRepo.find({
      relations: [
        'creator',
        'oracleInfo',
        'oracleInfo.web2Info',
        'oracleInfo.sourceChain',
        'oracleInfo.targetChain',
      ],
      where,
      take: size,
      skip: (index - 1) * size,
    });

    const count = await this.dapiRepo.count({
      where,
    });

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
    return this.dapiRepo.find();
  }

  async count(): Promise<number> {
    return this.dapiRepo.count();
  }

  find(id: string) {
    return this.dapiRepo.findOne({
      relations: [
        'creator',
        'oracleInfo',
        'oracleInfo.web2Info',
        'oracleInfo.sourceChain',
        'oracleInfo.targetChain',
      ],
      where: {
        id,
      },
    });
  }

  async update(entity: DapiEntity): Promise<any> {
    entity.update_at = new Date();
    return this.dapiRepo.update({ id: entity.id }, entity);
  }

  async save(entity: DapiEntity): Promise<DapiEntity> {
    return this.dapiRepo.save(entity);
  }

  async updateStatus(id: string, status: number) {
    const res = await this.dataSource
      .getRepository(DapiEntity)
      .update({ id: id }, { status: status, update_at: new Date() });
    if (res.affected) {
      console.log('update status success');
    } else {
      console.log('update status failed');
    }
  }

  async deleteById(id: string) {
    return this.dapiRepo.delete({ id: id });
  }
}

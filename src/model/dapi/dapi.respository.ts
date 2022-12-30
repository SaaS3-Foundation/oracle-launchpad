import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { DapiEntity, JobStatus } from './dapi.entity';

@Injectable()
export class DapiRepository {
  constructor(
    @Inject('DAPI_REPOSITORY')
    private readonly repo: Repository<DapiEntity>,
    // @InjectRepository(UserEntity)
    // private readonly userRepository: Repository<UserEntity>,
    @Inject('PG_SOURCE')
    private dataSource: DataSource,
  ) {}

  async page(index: number, size: number): Promise<any> {
    const queryBuilder = this.repo.createQueryBuilder('dapi');

    const data = await queryBuilder
      .where({ status: JobStatus.DONE })
      .leftJoinAndSelect('dapi.creator', 'creator')
      .addSelect('creator')
      .orderBy('dapi.create_at', 'DESC')
      .take(size)
      .skip((index - 1) * size)
      .getMany();

    const count = await queryBuilder
      .where({ status: JobStatus.DONE })
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
    return this.repo
      .createQueryBuilder('dapi')
      .where({ id: id })
      .leftJoinAndSelect('dapi.creator', 'creator')
      .addSelect('creator')
      .getOne();
  }

  async update(entity: DapiEntity): Promise<any> {
    entity.update_at = new Date();
    return this.repo.update({ id: entity.id }, entity);
  }

  async save(entity: DapiEntity): Promise<DapiEntity> {
    return this.repo.save(entity);
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
    return this.repo.delete({ id: id });
  }
}

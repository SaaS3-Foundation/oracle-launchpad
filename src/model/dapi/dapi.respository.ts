import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DapiEntity } from './dapi.entity';

@Injectable()
export class DapiRepository {
  constructor(
    @Inject('DAPI_REPOSITORY')
    private repo: Repository<DapiEntity>,
  ) {}

  async page(index: number, size: number): Promise<DapiEntity[]> {
    return this.repo
    .createQueryBuilder('dapi')
    .orderBy('dpi.create_at', 'DESC')
    .take(size)
    .skip((index-1)*size)
    .getMany();
  }

  async findAll(): Promise<DapiEntity[]> {
    return this.repo.find();
  }
}
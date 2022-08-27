import { Injectable, Inject } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { FaucetEntity } from './faucet.entity';

@Injectable()
export class FaucetRepository {
  constructor(
    @Inject('FAUCET_REPOSITORY')
    private readonly repo: Repository<FaucetEntity>,
    @Inject('PG_SOURCE')
    private dataSource: DataSource,
  ) {}

  async findAll(): Promise<FaucetEntity[]> {
    return this.repo.find();
  }

  async count(): Promise<number> {
    return this.repo.count();
  }

  async findAllBy(condition: any): Promise<FaucetEntity[]> {
    return this.dataSource
      .getRepository(FaucetEntity)
      .createQueryBuilder('faucet')
      .where(condition)
      .getMany();
  }

  async findOneBy(condition: any): Promise<FaucetEntity> {
    return this.dataSource
      .getRepository(FaucetEntity)
      .createQueryBuilder('faucet')
      .where(condition)
      .orderBy('faucet.create_at', 'DESC')
      .getOne();
  }

  async fetch(condition: any): Promise<FaucetEntity> {
    return this.dataSource
      .getRepository(FaucetEntity)
      .createQueryBuilder('faucet')
      .where(condition)
      .orderBy('faucet.update_at', 'ASC')
      .getOne();
  }

  async save(entity: FaucetEntity): Promise<FaucetEntity> {
    return this.repo.save(entity);
  }

  async update(entity: any): Promise<any> {
    return this.repo.update({ address: entity.address }, entity);
  }

  async pendingCnt(): Promise<number> {
    return this.dataSource
      .getRepository(FaucetEntity)
      .createQueryBuilder('faucet')
      .where({ given: false })
      .getCount();
  }
}

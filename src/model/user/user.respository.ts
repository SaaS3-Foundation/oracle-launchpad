import { Injectable, Inject } from '@nestjs/common';
import { DataSource, FindManyOptions, Repository } from 'typeorm';
import { UserEntity } from './user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly repo: Repository<UserEntity>,
    @Inject('PG_SOURCE')
    private dataSource: DataSource,
  ) {}
  private relations = [
    'wallets',
    'wallets.chain',
    'dapis',
    'dapis.oracleInfo',
    'dapis.oracleInfo.targetChain',
    'dapis.oracleInfo.sourceChain',
    'dapis.oracleInfo.web2Info',
  ];

  async page(index: number, size: number): Promise<any> {
    const data = await this.dataSource
      .getRepository(UserEntity)
      .createQueryBuilder('user')
      .orderBy('user.create_at', 'DESC')
      .take(size)
      .skip((index - 1) * size)
      .getMany();

    const count = await this.dataSource
      .getRepository(UserEntity)
      .createQueryBuilder('user')
      .getCount();

    return {
      size: size,
      page: index,
      count: data.length,
      list: data,
      total: count,
      all: Math.floor(count / size) + (count % size > 0 ? 1 : 0),
    };
  }

  _find(options: FindManyOptions<UserEntity>) {
    return this.repo.find({
      relations: this.relations,
      ...options,
    });
  }
  _findOne(options: FindManyOptions<UserEntity>) {
    return this.repo.findOne({
      relations: this.relations,
      ...options,
    });
  }

  findAll() {
    return this.repo.find({ relations: ['dapis'] });
  }

  count() {
    return this.repo.count();
  }

  getOneByAddress(address: string) {
    return this._findOne({
      where: {
        wallets: { address },
      },
    });
  }

  getOneById(id: string) {
    return this._findOne({ where: { id } });
  }

  async update(entity: UserEntity): Promise<any> {
    return this.repo.update({ id: entity.id }, entity);
  }

  async save(entity: UserEntity): Promise<UserEntity> {
    return this.repo.save(entity);
  }

  async deleteById(id: string) {
    return this.repo.delete({ id: id });
  }
}

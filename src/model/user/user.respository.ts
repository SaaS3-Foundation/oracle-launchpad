import { Injectable, Inject } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserEntity } from './user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly repo: Repository<UserEntity>,
    @Inject('PG_SOURCE')
    private dataSource: DataSource,
  ) {}

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

  async findAll(): Promise<UserEntity[]> {
    return this.repo.find({ relations: ['oracles'] });
  }

  async count(): Promise<number> {
    return this.repo.count();
  }

  async find(id: string): Promise<UserEntity> {
    return this.repo
      .createQueryBuilder('user')
      .where({ id })
      .leftJoinAndSelect('user.oracles', 'oracles')
      .getOne();
  }

  async update(entity: UserEntity): Promise<any> {
    entity.update_at = new Date();
    return this.repo.update({ id: entity.id }, entity);
  }

  async save(entity: UserEntity): Promise<UserEntity> {
    return this.repo.save(entity);
  }

  async deleteById(id: string) {
    return this.repo.delete({ id: id });
  }
}

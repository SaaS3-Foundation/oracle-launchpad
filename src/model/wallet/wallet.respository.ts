import { Injectable, Inject } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { WalletEntity } from './wallet.entity';

@Injectable()
export class WalletRepository {
  constructor(
    @Inject('WALLET_REPOSITORY')
    private readonly repo: Repository<WalletEntity>,
    @Inject('PG_SOURCE')
    private dataSource: DataSource,
  ) {}

  getByAddress(address: string) {
    return this.repo.findOne({ where: { address } });
  }

  findByAddress(address: string[]) {
    return this.repo.find({ where: { address: In(address) } });
  }

  save(entity: WalletEntity) {
    return this.repo.save(entity);
  }

  async deleteById(id: string) {
    return this.repo.delete({ id: id });
  }
}

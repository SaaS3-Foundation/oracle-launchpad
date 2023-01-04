import { Injectable, Inject } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { Repository } from 'typeorm';
import { ChainEntity } from './chain.entity';
import { network } from './network';

@Injectable()
export class ChainRepository {
  constructor(
    @Inject('CHAIN_REPOSITORY')
    private readonly repo: Repository<ChainEntity>,
  ) {
    this.init();
  }

  private async init() {
    for (const n of network) {
      this.save(n as ChainEntity);
    }
  }

  findByChainId(chainId: string) {
    return this.repo.findOneBy({ chainId });
  }

  async save(chain: ChainEntity) {
    const exists = await this.findByChainId(chain.chainId);
    if (exists) {
      return exists;
    }
    return this.repo.insert({ ...chain, id: nanoid() });
  }
}

import { Column, Entity } from 'typeorm';
import BaseEntity from '../base.entity';
import { ChainType } from './types';

@Entity('chain')
export class ChainEntity extends BaseEntity {
  public constructor(init?: Partial<ChainEntity>) {
    super(init);
    Object.assign(this, init);
  }

  @Column({ type: 'varchar', length: 100, unique: true })
  chainId: string;

  @Column({ type: 'numeric' })
  type: ChainType;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  wsProvider: string;

  @Column({ type: 'varchar', nullable: true })
  httpProvider: string;

  @Column({ type: 'varchar', nullable: true })
  clusterId: string;

  @Column({ type: 'varchar', nullable: true })
  pruntime: string;
}

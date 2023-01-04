import { Entity, Column, JoinColumn, ManyToOne } from 'typeorm';
import { ChainEntity } from '../chain/chain.entity';
import BaseEntity from '../base.entity';
import { UserEntity } from '../user/user.entity';

@Entity('wallet')
export class WalletEntity extends BaseEntity {
  public constructor(init?: Partial<WalletEntity>) {
    super(init);
    Object.assign(this, init);
  }
  @Column({ type: 'varchar', length: 200 })
  address: string;

  @ManyToOne(() => ChainEntity)
  @JoinColumn({ name: 'chain_id', referencedColumnName: 'chainId' })
  chain: ChainEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn()
  user?: UserEntity;
}

import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { ChainEntity } from '../chain/chain.entity';
import BaseEntity from '../base.entity';
import { Web2InfoEntity } from '../web2Info/web2Info.entity';

@Entity('oracle')
export class OracleEntity extends BaseEntity {
  public constructor(init?: Partial<OracleEntity>) {
    super(init);
    Object.assign(this, init);
  }

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  // oracle address
  @Column({ type: 'varchar', length: 200, nullable: true })
  address: string;

  // phala anchor contract address
  // required by phala chain
  @Column({ type: 'varchar', length: 200, nullable: true })
  anchor: string;

  // wallet address which submited the answer
  @Column({ type: 'varchar', length: 200, nullable: true })
  wallet: string;

  // wallet private key
  @Column({ type: 'varchar', length: 200, nullable: true })
  privateKey: string;

  @OneToOne(() => Web2InfoEntity, { cascade: true })
  @JoinColumn({ name: 'web2_info_id' })
  web2Info: Web2InfoEntity;

  @ManyToOne(() => ChainEntity)
  @JoinColumn({ name: 'source_chain_id', referencedColumnName: 'chainId' })
  sourceChain: ChainEntity;

  @ManyToOne(() => ChainEntity)
  @JoinColumn({ name: 'target_chain_id', referencedColumnName: 'chainId' })
  targetChain: ChainEntity;
}

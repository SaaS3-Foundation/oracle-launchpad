import { RequestMethod } from '@nestjs/common';
import {
  PrimaryColumn,
  Entity,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { ChainInfo } from '../dapi/dapi.entity';

export class Profile {
  name: string;
  avatar: string;
  description: string;
  email: string;
  twitter: string;
  github: string;
  telegram: string;
}

export class WalletInfo {
  chain: ChainInfo;
  address: string;
}

@Entity('user')
export class UserEntity {
  public constructor(init?: Partial<UserEntity>) {
    Object.assign(this, init);
  }

  @PrimaryColumn()
  id: string;

  @Column({ type: 'varchar', length: 200 })
  userAddress: string;

  @Column({ type: 'jsonb', nullable: true })
  profile: Profile;

  @Column({ type: 'jsonb', nullable: true })
  walletInfo: WalletInfo[];

  @Column({ type: 'jsonb', nullable: true })
  oracles: string[];

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  create_at: Date;

  @Column({ type: 'varchar', length: 300 })
  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  update_at: Date;
}

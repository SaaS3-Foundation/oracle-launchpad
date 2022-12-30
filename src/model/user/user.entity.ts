import {
  PrimaryColumn,
  Entity,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ChainInfo, DapiEntity } from '../dapi/dapi.entity';

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

  @Column({ type: 'jsonb', nullable: true })
  profile: Profile;

  @Column({ type: 'jsonb', nullable: true })
  walletInfo: WalletInfo[];

  // @Column({ type: 'jsonb', nullable: true })
  @OneToMany(() => DapiEntity, (dapi) => dapi.creator)
  oracles: DapiEntity[];

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  create_at: Date;

  @Column({ type: 'varchar', length: 300 })
  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  update_at: Date;
}

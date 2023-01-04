import { Entity, Column, OneToMany } from 'typeorm';
import { DapiEntity } from '../dapi/dapi.entity';
import BaseEntity from '../base.entity';
import { WalletEntity } from '../wallet/wallet.entity';

@Entity('user')
export class UserEntity extends BaseEntity {
  public constructor(init?: Partial<UserEntity>) {
    super(init);
    Object.assign(this, init);
  }
  @Column({ type: 'varchar', length: 100, nullable: true, default: '' })
  name: string;

  @Column({ type: 'varchar', length: 300, nullable: true, default: '' })
  avatar: string;

  @Column({ type: 'text', nullable: true, default: '' })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true, default: '' })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true, default: '' })
  twitter: string;

  @Column({ type: 'varchar', length: 50, nullable: true, default: '' })
  github: string;

  @Column({ type: 'varchar', length: 50, nullable: true, default: '' })
  telegram: string;

  @OneToMany(() => WalletEntity, (entity) => entity.user)
  wallets?: WalletEntity[];

  @OneToMany(() => DapiEntity, (entity) => entity.creator)
  dapis?: DapiEntity[];
}

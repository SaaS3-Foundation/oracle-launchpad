import { RequestMethod } from '@nestjs/common';
import {
  PrimaryColumn,
  Entity,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OracleEntity } from '../oracle/oracle.entity';
import BaseEntity from '../base.entity';
import { UserEntity } from '../user/user.entity';
import { JobStatus, Visibility } from './types';

@Entity('dapi')
export class DapiEntity extends BaseEntity {
  public constructor(init?: Partial<DapiEntity>) {
    super(init);
    Object.assign(this, init);
  }

  @Column({ type: 'text', nullable: true })
  creatorNote: string;

  @Column({ type: 'smallint' })
  status: JobStatus;

  @Column({ type: 'smallint', nullable: true })
  visibility: Visibility;

  @Column({ type: 'varchar', length: 300, default: '' })
  logo_url: string;

  @OneToOne(() => OracleEntity, { cascade: ['insert'] })
  @JoinColumn({ name: 'oracle_id' })
  oracleInfo: OracleEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'creator_id' })
  creator: UserEntity;
}

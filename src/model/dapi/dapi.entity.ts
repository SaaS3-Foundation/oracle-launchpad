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
} from 'typeorm';
import { UserEntity } from '../user/user.entity';

export enum JobStatus {
  PENDING = 0, // 0%
  DEPLOYING_PHALA_ANCHOR,
  PHALA_ANCHOR_DEPOLYED,
  CONFIGURING_PHALA_ANCHOR,
  PHALA_ANCHOR_CONFIGED,
  DEPLOYING_PHALA_TRANSACTOR,
  PHALA_TRANSACTOR_DEPLOYED,
  CONFIGURING_PHALA_TRANSACTOR,
  PHALA_TRANSACTOR_CONFIGED,
  DEPOLYING_SAAS3_DRUNTIME,
  SAAS3_DRUNTIME_DEPLOYED,
  CONFIGURING_DRUNTIME,
  DRUNTIME_CONFIGED,
  ERROR,
  DONE, // 100%
}

export enum ChainType {
  EVM = 0, // evm compatible chain
  PHALA,
}

export class ChainInfo {
  type: ChainType;
  name: string;
  wsProvider: string; // websocket provider
  httpProvider: string; // http provider
  id: number; // chainid
  clusterId: string; // required when type is PHALA
  pruntime: string; // required when type is PHALA
}

export class Web2Info {
  title: string;
  uri: string;
  method: RequestMethod;
  headers: Record<string, string>;
  params: Record<string, string>;
  body: any;
}

export class OracleInfo {
  sourceChain: ChainInfo;
  targetChain: ChainInfo;
  title: string;
  description: string;
  address: string;
  web2Info: Web2Info;
}
export class CreatorInfo {
  notes: string;
}

export enum Visibility {
  PUBLIC,
  PRIVATE,
}

@Entity('dapi')
export class DapiEntity {
  public constructor(init?: Partial<DapiEntity>) {
    Object.assign(this, init);
  }

  @PrimaryColumn()
  id: string;

  @Column({ type: 'jsonb', nullable: true })
  oracleInfo: OracleInfo;

  @Column({ type: 'text', nullable: true })
  creatorNote: string;

  @Column({ type: 'numeric' })
  status: number;

  @Column({ type: 'numeric', nullable: true })
  visibility: Visibility;

  @Column({ type: 'varchar', length: 300 })
  logo_url: string;

  // @Column({ type: 'varchar', length: 200 })
  // creator_id: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'creator_id' })
  creator: UserEntity;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  create_at: Date;

  @Column({ type: 'varchar', length: 300 })
  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  update_at: Date;
}

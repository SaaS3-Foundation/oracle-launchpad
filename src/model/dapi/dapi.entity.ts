import { RequestMethod } from '@nestjs/common';
import {
  PrimaryColumn,
  Entity,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

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
}

export class Web2Info {
  uri: string;
  method: RequestMethod;
  headers: Record<string, string>;
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

@Entity('dapi')
export class DapiEntity {
  public constructor(init?: Partial<DapiEntity>) {
    Object.assign(this, init);
  }

  @PrimaryColumn()
  id: string;

  @Column({ type: 'jsonb', nullable: true })
  oracleInfo: OracleInfo;

  @Column({ type: 'jsonb', nullable: true })
  creatorInfo: CreatorInfo;

  @Column({ type: 'numeric' })
  status: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  create_at: Date;

  @Column({ type: 'varchar', length: 300 })
  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  update_at: Date;
}

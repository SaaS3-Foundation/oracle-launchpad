import { Column, Entity } from 'typeorm';
import BaseEntity from '../base.entity';
import { AuthType, Methods } from './types';

@Entity('apiinfo')
export class Web2InfoEntity extends BaseEntity {
  public constructor(init?: Partial<Web2InfoEntity>) {
    super(init);
    Object.assign(this, init);
  }

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'varchar' })
  uri: string;

  @Column({ type: 'varchar' })
  method: Methods;

  @Column({ type: 'jsonb' })
  headers: Record<string, string>;

  @Column({ type: 'jsonb' })
  params: Record<string, string>;

  @Column({ type: 'jsonb', nullable: true })
  fixedParams: Map<string, boolean>;

  @Column({ type: 'jsonb', nullable: true })
  fixedHeaders: Map<string, boolean>;

  @Column({ type: 'jsonb' })
  body: Record<string, string>;

  @Column({ type: 'numeric' })
  authType: AuthType;
}

import { Column, Entity } from 'typeorm';
import BaseEntity from '../base.entity';
import { Methods } from './types';

@Entity('web2Info')
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

  @Column({ type: 'jsonb' })
  fixedParams: Map<string, boolean>;

  @Column({ type: 'jsonb' })
  fixedHeaders: Map<string, boolean>;

  @Column({ type: 'jsonb' })
  body: Record<string, string>;
}

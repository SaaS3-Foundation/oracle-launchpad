import {
  Column,
  CreateDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export default class BaseEntity {
  public constructor(init?: Partial<BaseEntity>) {
    Object.assign(this, init);
  }

  @PrimaryColumn()
  id?: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  create_at?: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  update_at?: Date;

  @Column({ type: 'int', nullable: true, default: -1 })
  state?: number;

  @Column({ type: 'numeric', nullable: true, default: -1 })
  delete_at?: number;
}

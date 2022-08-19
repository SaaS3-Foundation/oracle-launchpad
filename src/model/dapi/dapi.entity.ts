import {
  PrimaryColumn,
  Entity,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('dapi')
export class DapiEntity {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'varchar', length: 50 })
  title: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 300 })
  creator: string;

  @Column({ type: 'varchar', length: 20, array: true, nullable: true })
  tags: string[];

  @Column({ type: 'varchar', length: 40, nullable: true })
  requesterAddress: string;

  @Column({ type: 'text', nullable: true })
  demo: string;

  @Column({ type: 'text', nullable: true })
  requester: string;

  @Column({ type: 'jsonb', nullable: true })
  requesterAbi: any;

  @Column({ type: 'numeric' })
  status: number;

  @Column({ type: 'text', nullable: true })
  triggers: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  create_at: Date;

  @Column({ type: 'varchar', length: 300 })
  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  update_at: Date;
}

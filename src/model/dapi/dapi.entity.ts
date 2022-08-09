import { PrimaryGeneratedColumn, Entity, Column, UpdateDateColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class DapiEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 1024, nullable: true })
    description: string | null;

    @Column({ type: 'varchar', length: 300 })
    creator: string;

    @Column({ type: 'array'})
    tags: string[];

    @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    create_at: Date;

    @Column({ type: 'varchar', length: 300 })
    @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    update_at: Date;

}
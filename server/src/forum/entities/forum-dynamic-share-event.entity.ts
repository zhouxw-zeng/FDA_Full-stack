import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('forum_dynamic_share_events')
export class ForumDynamicShareEvent {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'dynamic_id', type: 'varchar', length: 32 })
  dynamicId: string;

  @Column({ name: 'customer_id', type: 'bigint', unsigned: true })
  customerId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  channel: string | null;

  @Column({ name: 'request_id', type: 'varchar', length: 100, nullable: true, unique: true })
  requestId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;
}

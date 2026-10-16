import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type ForumInteractionAction =
  'like' | 'unlike' | 'favorite' | 'unfavorite' | 'share' | 'comment' | 'delete_comment';

@Entity('forum_interaction_events')
export class ForumInteractionEvent {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'dynamic_id', type: 'varchar', length: 32 })
  dynamicId: string;

  @Column({ name: 'customer_id', type: 'bigint', unsigned: true })
  customerId: string;

  @Column({
    type: 'enum',
    enum: ['like', 'unlike', 'favorite', 'unfavorite', 'share', 'comment', 'delete_comment'],
  })
  action: ForumInteractionAction;

  @Column({ name: 'target_id', type: 'varchar', length: 64, nullable: true })
  targetId: string | null;

  @Column({ name: 'request_id', type: 'varchar', length: 100, nullable: true })
  requestId: string | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;
}

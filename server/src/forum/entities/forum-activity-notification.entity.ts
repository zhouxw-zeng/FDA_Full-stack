import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type ForumNotificationType = 'dynamic_like' | 'dynamic_comment' | 'comment_reply';

@Entity('forum_activity_notifications')
export class ForumActivityNotification {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'recipient_id', type: 'bigint', unsigned: true })
  recipientId: string;

  @Column({ name: 'actor_id', type: 'bigint', unsigned: true })
  actorId: string;

  @Column({
    type: 'enum',
    enum: ['dynamic_like', 'dynamic_comment', 'comment_reply'],
  })
  type: ForumNotificationType;

  @Column({ name: 'dynamic_id', type: 'varchar', length: 32 })
  dynamicId: string;

  @Column({ name: 'target_id', type: 'varchar', length: 64, nullable: true })
  targetId: string | null;

  @Column({ name: 'is_read', type: 'tinyint', width: 1, default: 0 })
  isRead: number;

  @Column({ name: 'withdrawn_at', type: 'datetime', precision: 6, nullable: true })
  withdrawnAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;
}

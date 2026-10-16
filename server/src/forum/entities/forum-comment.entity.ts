import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('forum_comments')
export class ForumComment {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'dynamic_id', type: 'varchar', length: 32 })
  dynamicId: string;

  @Column({ name: 'root_id', type: 'bigint', unsigned: true, nullable: true })
  rootId: string | null;

  @Column({ name: 'parent_id', type: 'bigint', unsigned: true, nullable: true })
  parentId: string | null;

  @Column({ name: 'customer_id', type: 'bigint', unsigned: true })
  customerId: string;

  @Column({ name: 'reply_to_customer_id', type: 'bigint', unsigned: true, nullable: true })
  replyToCustomerId: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({
    name: 'audit_status',
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved',
  })
  auditStatus: 'pending' | 'approved' | 'rejected';

  @Column({ name: 'like_count', type: 'int', unsigned: true, default: 0 })
  likeCount: number;

  @Column({ name: 'reply_count', type: 'int', unsigned: true, default: 0 })
  replyCount: number;

  @Column({ name: 'deleted_at', type: 'datetime', precision: 6, nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}

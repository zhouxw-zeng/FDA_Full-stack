import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CustomerUser } from '../../customers/entities/customer-user.entity';
import { ForumDynamicType } from './forum-dynamic-type.entity';

export interface ForumMediaItem {
  id: string;
  kind: 'album' | 'video';
  title: string;
  url?: string;
  seed: number;
  duration?: number;
  size: number;
}

@Entity('forum_dynamics')
export class ForumDynamic {
  @PrimaryColumn({ type: 'varchar', length: 32 })
  id: string;

  @Column({ name: 'customer_id', type: 'bigint', unsigned: true })
  customerId: string;

  @ManyToOne(() => CustomerUser, {
    eager: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerUser;

  @Column({ name: 'type_id', type: 'bigint', unsigned: true })
  typeId: string;

  @ManyToOne(() => ForumDynamicType, {
    eager: true,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'type_id' })
  type: ForumDynamicType;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'json' })
  media: ForumMediaItem[];

  @Column({ type: 'varchar', length: 100 })
  topic: string;

  @Column({ name: 'like_count', type: 'int', unsigned: true, default: 0 })
  likeCount: number;

  @Column({ name: 'comment_count', type: 'int', unsigned: true, default: 0 })
  commentCount: number;

  @Column({ name: 'share_count', type: 'int', unsigned: true, default: 0 })
  shareCount: number;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  pinned: number;

  @Column({
    name: 'audit_status',
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  auditStatus: 'pending' | 'approved' | 'rejected';

  @Column({ type: 'tinyint', width: 1, default: 0 })
  enabled: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}

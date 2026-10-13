import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type ForumEditorType = 'customer' | 'admin';

@Entity('forum_change_logs')
export class ForumChangeLog {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'target_type', type: 'varchar', length: 32, default: 'forum_dynamic' })
  targetType: string;

  @Column({ name: 'target_id', type: 'varchar', length: 32 })
  targetId: string;

  @Column({ name: 'owner_id', type: 'bigint', unsigned: true })
  ownerId: string;

  @Column({ name: 'editor_id', type: 'bigint', unsigned: true })
  editorId: string;

  @Column({ name: 'editor_type', type: 'enum', enum: ['customer', 'admin'] })
  editorType: ForumEditorType;

  @Column({ type: 'varchar', length: 32 })
  action: string;

  @CreateDateColumn({ name: 'changed_at', type: 'datetime', precision: 6 })
  changedAt: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  remark: string | null;

  @Column({ type: 'text', nullable: true })
  attachments: string | null;
}

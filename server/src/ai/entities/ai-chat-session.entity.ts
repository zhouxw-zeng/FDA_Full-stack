import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ai_chat_sessions')
export class AiChatSession {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'admin_user_id', type: 'bigint', unsigned: true })
  adminUserId: string;

  @Column({ name: 'model_config_id', type: 'bigint', unsigned: true, nullable: true })
  modelConfigId: string | null;

  @Column({ length: 200 })
  title: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}

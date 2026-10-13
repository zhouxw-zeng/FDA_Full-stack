import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export interface AiStoredAttachment {
  name: string;
  mimeType?: string;
  content: string;
}

@Entity('ai_chat_messages')
export class AiChatMessage {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'session_id', type: 'bigint', unsigned: true })
  sessionId: string;

  @Column({ type: 'enum', enum: ['system', 'user', 'assistant'] })
  role: 'system' | 'user' | 'assistant';

  @Column({ type: 'longtext' })
  content: string;

  @Column({ type: 'json', nullable: true })
  attachments: AiStoredAttachment[] | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;
}

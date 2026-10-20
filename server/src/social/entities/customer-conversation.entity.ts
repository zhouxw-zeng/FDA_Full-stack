import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('customer_conversations')
@Index('uk_customer_conversation_pair', ['customerAId', 'customerBId'], { unique: true })
export class CustomerConversation {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'customer_a_id', type: 'bigint', unsigned: true })
  customerAId: string;

  @Column({ name: 'customer_b_id', type: 'bigint', unsigned: true })
  customerBId: string;

  @Column({ name: 'last_message_id', type: 'bigint', unsigned: true, nullable: true })
  lastMessageId: string | null;

  @Column({ name: 'last_message_at', type: 'datetime', precision: 6, nullable: true })
  lastMessageAt: Date | null;

  @Column({ name: 'pinned_by_a', type: 'tinyint', width: 1, default: 0 })
  pinnedByA: number;

  @Column({ name: 'pinned_by_b', type: 'tinyint', width: 1, default: 0 })
  pinnedByB: number;

  @Column({ name: 'deleted_by_a', type: 'tinyint', width: 1, default: 0 })
  deletedByA: number;

  @Column({ name: 'deleted_by_b', type: 'tinyint', width: 1, default: 0 })
  deletedByB: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}

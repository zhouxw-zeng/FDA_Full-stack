import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type CustomerMessageMode = 'guestbook' | 'chat';

@Entity('customer_im_messages')
@Index('uk_customer_im_request', ['requestId'], { unique: true })
export class CustomerMessage {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'sender_id', type: 'bigint', unsigned: true })
  senderId: string;

  @Column({ name: 'recipient_id', type: 'bigint', unsigned: true })
  recipientId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    name: 'delivery_mode',
    type: 'enum',
    enum: ['guestbook', 'chat'],
    default: 'guestbook',
  })
  deliveryMode: CustomerMessageMode;

  @Column({ name: 'request_id', type: 'varchar', length: 100, nullable: true })
  requestId: string | null;

  @Column({ name: 'is_read', type: 'tinyint', width: 1, default: 0 })
  isRead: number;

  @Column({ name: 'read_at', type: 'datetime', precision: 6, nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;
}

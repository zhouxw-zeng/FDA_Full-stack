import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('customer_follows')
@Index('uk_customer_follows_pair', ['followerId', 'followingId'], { unique: true })
export class CustomerFollow {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'follower_id', type: 'bigint', unsigned: true })
  followerId: string;

  @Column({ name: 'following_id', type: 'bigint', unsigned: true })
  followingId: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;
}

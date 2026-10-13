import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdminUser } from '../../users/entities/admin-user.entity';

@Entity('auth_tokens')
export class AuthToken {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: string;

  @ManyToOne(() => AdminUser, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: AdminUser;

  @Column({ name: 'access_token_hash', type: 'char', length: 64, unique: true })
  accessTokenHash: string;

  @Column({ name: 'refresh_token_hash', type: 'char', length: 64, unique: true })
  refreshTokenHash: string;

  @Column({ name: 'access_expires_at', type: 'datetime', precision: 6 })
  accessExpiresAt: Date;

  @Column({ name: 'refresh_expires_at', type: 'datetime', precision: 6 })
  refreshExpiresAt: Date;

  @Column({ name: 'last_used_at', type: 'datetime', precision: 6, nullable: true })
  lastUsedAt: Date | null;

  @Column({ name: 'revoked_at', type: 'datetime', precision: 6, nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}

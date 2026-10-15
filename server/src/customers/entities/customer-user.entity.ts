import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type CustomerAuditStatus = 'pending' | 'approved' | 'rejected';

@Entity('customer_users')
export class CustomerUser {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  username: string | null;

  @Column({ type: 'varchar', length: 50 })
  nickname: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar: string | null;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  passwordHash: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  email: string | null;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  gender: number;

  @Column({ type: 'date', nullable: true })
  birthday: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  region: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  signature: string | null;

  @Column({ name: 'vip_level', type: 'tinyint', width: 1, default: 1 })
  vipLevel: number;

  @Column({
    name: 'audit_status',
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  auditStatus: CustomerAuditStatus;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  enabled: number;

  @Column({ name: 'audit_remark', type: 'varchar', length: 255, nullable: true })
  auditRemark: string | null;

  @Column({ name: 'audited_at', type: 'datetime', precision: 6, nullable: true })
  auditedAt: Date | null;

  @Column({ name: 'audited_by', type: 'bigint', unsigned: true, nullable: true })
  auditedBy: string | null;

  @Column({ name: 'dynamic_count', type: 'int', unsigned: true, default: 0 })
  dynamicCount: number;

  @Column({ name: 'last_login_at', type: 'datetime', precision: 6, nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}

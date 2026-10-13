import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ai_quota_accounts')
export class AiQuotaAccount {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'provider_code', length: 50, unique: true })
  providerCode: string;

  @Column({
    name: 'quota_limit',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => Number(value),
    },
  })
  quotaLimit: number;

  @Column({
    name: 'used_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => Number(value),
    },
  })
  usedAmount: number;

  @Column({ length: 10, default: 'TOKEN' })
  currency: string;

  @Column({
    name: 'refresh_strategy',
    type: 'enum',
    enum: ['manual', 'daily', 'monthly'],
    default: 'manual',
  })
  refreshStrategy: 'manual' | 'daily' | 'monthly';

  @Column({ name: 'last_refreshed_at', type: 'datetime', precision: 6, nullable: true })
  lastRefreshedAt: Date | null;

  @Column({ name: 'next_refresh_at', type: 'datetime', precision: 6, nullable: true })
  nextRefreshAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}

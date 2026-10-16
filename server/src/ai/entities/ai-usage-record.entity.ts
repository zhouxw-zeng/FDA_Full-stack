import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ai_usage_records')
export class AiUsageRecord {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'model_config_id', type: 'bigint', unsigned: true, nullable: true })
  modelConfigId: string | null;

  @Column({ name: 'provider_code', length: 50 })
  providerCode: string;

  @Column({ name: 'model_name', length: 100 })
  modelName: string;

  @Column({ length: 50 })
  scene: string;

  @Column({ name: 'request_id', type: 'varchar', length: 100, nullable: true })
  requestId: string | null;

  @Column({ name: 'prompt_tokens', type: 'int', unsigned: true, default: 0 })
  promptTokens: number;

  @Column({ name: 'completion_tokens', type: 'int', unsigned: true, default: 0 })
  completionTokens: number;

  @Column({ name: 'total_tokens', type: 'int', unsigned: true, default: 0 })
  totalTokens: number;

  @Column({ name: 'latency_ms', type: 'int', unsigned: true, default: 0 })
  latencyMs: number;

  @Column({ type: 'enum', enum: ['success', 'failed'], default: 'success' })
  status: 'success' | 'failed';

  @Column({ name: 'error_message', type: 'varchar', length: 1000, nullable: true })
  errorMessage: string | null;

  @Column({ name: 'admin_user_id', type: 'bigint', unsigned: true, nullable: true })
  adminUserId: string | null;

  @Column({ name: 'customer_id', type: 'bigint', unsigned: true, nullable: true })
  customerId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;
}

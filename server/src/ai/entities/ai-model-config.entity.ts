import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AiSkill } from './ai-skill.entity';

@Entity('ai_model_configs')
export class AiModelConfig {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'provider_code', length: 50 })
  providerCode: string;

  @Column({ name: 'provider_name', length: 100 })
  providerName: string;

  @Column({ name: 'base_url', length: 500 })
  baseUrl: string;

  @Column({
    name: 'api_key',
    type: 'varchar',
    length: 1000,
    nullable: true,
    select: false,
  })
  apiKey: string | null;

  @Column({ name: 'model_name', length: 100 })
  modelName: string;

  @Column({ name: 'display_name', length: 100 })
  displayName: string;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  status: number;

  @Column({ name: 'is_default', type: 'tinyint', width: 1, default: 0 })
  isDefault: number;

  @Column({ name: 'max_tokens', type: 'int', unsigned: true, default: 2048 })
  maxTokens: number;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0.7,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => Number(value),
    },
  })
  temperature: number;

  @Column({ name: 'timeout_ms', type: 'int', unsigned: true, default: 60000 })
  timeoutMs: number;

  @Column({ name: 'extra_config', type: 'json', nullable: true })
  extraConfig: Record<string, unknown> | null;

  @Column({ name: 'system_prompt', type: 'text', nullable: true })
  systemPrompt: string | null;

  @Column({ name: 'skill_ids', type: 'json' })
  skillIds: number[];

  @ManyToMany(() => AiSkill, (skill) => skill.models)
  @JoinTable({
    name: 'ai_model_skills',
    joinColumn: {
      name: 'model_config_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'skill_id',
      referencedColumnName: 'id',
    },
  })
  skills: AiSkill[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}

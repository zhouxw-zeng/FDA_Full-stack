import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdPartnerType } from './ad-partner-type.entity';

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string | number) => Number(value),
};

@Entity('ad_campaigns')
export class AdCampaign {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 100 })
  advertiser: string;

  @Column({ name: 'partner_type_id', type: 'bigint', unsigned: true, nullable: true })
  partnerTypeId: string | null;

  @ManyToOne(() => AdPartnerType, (partnerType) => partnerType.campaigns, {
    eager: true,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'partner_type_id' })
  partnerType: AdPartnerType | null;

  @Column({
    type: 'enum',
    enum: ['feed', 'banner', 'video_pre', 'splash'],
  })
  placement: 'feed' | 'banner' | 'video_pre' | 'splash';

  @Column({
    type: 'enum',
    enum: ['running', 'paused', 'ended', 'draft'],
    default: 'draft',
  })
  status: 'running' | 'paused' | 'ended' | 'draft';

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  budget: number;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  spent: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  impressions: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  clicks: number;

  @Column({ name: 'start_at', type: 'datetime', precision: 6 })
  startAt: Date;

  @Column({ name: 'end_at', type: 'datetime', precision: 6 })
  endAt: Date;

  @Column({ type: 'int', unsigned: true, default: 1 })
  seed: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}

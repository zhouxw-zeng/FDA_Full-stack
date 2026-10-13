import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdCampaign } from './ad-campaign.entity';

@Entity('ad_partner_types')
export class AdPartnerType {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'type_name', length: 100, unique: true })
  typeName: string;

  @Column({ name: 'type_code', length: 50, unique: true })
  typeCode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  remark: string | null;

  @Column({ name: 'integration_url', type: 'varchar', length: 500, nullable: true })
  integrationUrl: string | null;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  status: number;

  @Column({ name: 'requires_key', type: 'tinyint', width: 1, default: 0 })
  requiresKey: number;

  @Column({ name: 'key_id', type: 'varchar', length: 255, nullable: true })
  keyId: string | null;

  @Column({ name: 'key_secret', type: 'varchar', length: 500, nullable: true })
  keySecret: string | null;

  @OneToMany(() => AdCampaign, (campaign) => campaign.partnerType)
  campaigns: AdCampaign[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('forum_dynamic_types')
export class ForumDynamicType {
  @PrimaryGeneratedColumn({ name: 'type_id', type: 'bigint', unsigned: true })
  typeId: string;

  @Column({ name: 'type_name', length: 100, unique: true })
  typeName: string;

  @Column({ name: 'type_remark', type: 'varchar', length: 255, nullable: true })
  typeRemark: string | null;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  status: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}

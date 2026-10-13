import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('admin_routes')
export class AdminRoute {
  @PrimaryGeneratedColumn({ name: 'route_id', type: 'bigint', unsigned: true })
  routeId: string;

  @Column({ name: 'route_name', length: 100, unique: true })
  routeName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon: string | null;

  @Column({ name: 'route_path', length: 255, unique: true })
  routePath: string;

  @Column({ name: 'component_path', type: 'varchar', length: 255, nullable: true })
  componentPath: string | null;

  @Column({ name: 'pid', type: 'bigint', unsigned: true, nullable: true })
  pid: string | null;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  status: number;

  @Column({ name: 'route_type', type: 'tinyint', width: 1, default: 0 })
  routeType: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}

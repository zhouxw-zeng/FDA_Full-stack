import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdminUser } from '../../users/entities/admin-user.entity';

@Entity('admin_roles')
export class AdminRole {
  @PrimaryGeneratedColumn({ name: 'role_id', type: 'bigint', unsigned: true })
  roleId: string;

  @Column({ name: 'role_name', length: 50, unique: true })
  roleName: string;

  @Column({ name: 'role_remark', type: 'varchar', length: 255, nullable: true })
  roleRemark: string | null;

  @Column({ name: 'route_id_group', type: 'json' })
  routeIdGroup: number[];

  @OneToMany(() => AdminUser, (user) => user.role)
  users: AdminUser[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}

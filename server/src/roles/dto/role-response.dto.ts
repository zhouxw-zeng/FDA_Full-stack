import { ApiProperty } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty({ example: '1' })
  roleId: string;

  @ApiProperty({ example: '超级管理员' })
  roleName: string;

  @ApiProperty({ example: '拥有后台全部页面权限', nullable: true })
  roleRemark: string | null;

  @ApiProperty({
    example: [1, 3, 13],
    description: 'admin_routes.route_id 路由 ID 组',
    type: [Number],
  })
  routeIdGroup: number[];

  @ApiProperty({ example: '2026-10-12T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-12T08:00:00.000Z' })
  updatedAt: Date;
}

import { ApiProperty } from '@nestjs/swagger';

export class RouteResponseDto {
  @ApiProperty({ example: 1 })
  routeId: number;

  @ApiProperty({ example: '工作台' })
  routeName: string;

  @ApiProperty({ example: 'DataBoard', nullable: true })
  icon: string | null;

  @ApiProperty({ example: '/dashboard' })
  routePath: string;

  @ApiProperty({ example: '@/views/dashboard/index.vue', nullable: true })
  componentPath: string | null;

  @ApiProperty({ example: null, nullable: true })
  pid: number | null;

  @ApiProperty({ example: 0, description: '0 启用，1 禁用' })
  status: number;

  @ApiProperty({ example: 1, description: '0 目录，1 菜单' })
  routeType: number;

  @ApiProperty({ example: '2026-10-12T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-12T08:00:00.000Z' })
  updatedAt: Date;
}

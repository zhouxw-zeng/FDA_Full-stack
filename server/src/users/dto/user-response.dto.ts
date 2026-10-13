import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'operator' })
  username: string;

  @ApiProperty({ example: '内容运营' })
  nickname: string;

  @ApiProperty({ example: 'operator@example.com' })
  email: string;

  @ApiProperty({ example: '+86 13800138000', nullable: true })
  phone: string | null;

  @ApiProperty({ example: 'https://example.com/avatar.png', nullable: true })
  avatar: string | null;

  @ApiProperty({ example: '内容运营部', nullable: true })
  department: string | null;

  @ApiProperty({ example: '负责社区内容审核。', nullable: true })
  bio: string | null;

  @ApiProperty({ example: '2' })
  roleId: string;

  @ApiProperty({ example: '普通用户' })
  roleName: string;

  @ApiProperty({ example: [13], type: [Number] })
  routeIdGroup: number[];

  @ApiProperty({ example: 1 })
  status: number;

  @ApiProperty({ example: '2026-10-12T08:00:00.000Z', nullable: true })
  lastLoginAt: Date | null;

  @ApiProperty({ example: '2026-10-12T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-12T08:00:00.000Z' })
  updatedAt: Date;
}

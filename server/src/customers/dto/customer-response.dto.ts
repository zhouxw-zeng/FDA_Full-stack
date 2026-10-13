import { ApiProperty } from '@nestjs/swagger';

export class CustomerResponseDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'c_end_001', nullable: true })
  username: string | null;

  @ApiProperty({ example: '光圈旅行者' })
  nickname: string;

  @ApiProperty({ example: 'https://example.com/avatar.png', nullable: true })
  avatar: string | null;

  @ApiProperty({ example: '13810000001' })
  phone: string;

  @ApiProperty({ example: 'c_end_001@example.com', nullable: true })
  email: string | null;

  @ApiProperty({ example: 0, description: '0 未知，1 男，2 女' })
  gender: number;

  @ApiProperty({ example: '1995-06-15', nullable: true })
  birthday: string | null;

  @ApiProperty({ example: '上海', nullable: true })
  region: string | null;

  @ApiProperty({ example: '记录城市与海岸线。', nullable: true })
  signature: string | null;

  @ApiProperty({ example: 1, description: 'VIP 等级 1-5' })
  vipLevel: number;

  @ApiProperty({ example: 'pending', enum: ['pending', 'approved', 'rejected'] })
  auditStatus: 'pending' | 'approved' | 'rejected';

  @ApiProperty({ example: 1, description: '1 启用，0 禁用' })
  enabled: number;

  @ApiProperty({ example: '资料审核通过', nullable: true })
  auditRemark: string | null;

  @ApiProperty({ example: '2026-10-13T08:00:00.000Z', nullable: true })
  auditedAt: Date | null;

  @ApiProperty({ example: '1', nullable: true })
  auditedBy: string | null;

  @ApiProperty({ example: 3 })
  dynamicCount: number;

  @ApiProperty({ example: '2026-10-13T08:00:00.000Z', nullable: true })
  lastLoginAt: Date | null;

  @ApiProperty({ example: '2026-10-13T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-13T08:00:00.000Z' })
  updatedAt: Date;
}

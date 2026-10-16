import { ApiProperty } from '@nestjs/swagger';

export class ForumMediaItemResponseDto {
  @ApiProperty({ example: 'M-5000' })
  id: string;

  @ApiProperty({ example: 'album', enum: ['album', 'video'] })
  kind: 'album' | 'video';

  @ApiProperty({ example: '老码头蓝调时刻' })
  title: string;

  @ApiProperty({ example: 1024 })
  seed: number;

  @ApiProperty({ example: 86, nullable: true })
  duration?: number;

  @ApiProperty({ example: 4280000 })
  size: number;
}

export class ForumDynamicAuthorResponseDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: '光圈旅行者' })
  nickname: string;

  @ApiProperty({ example: '', nullable: true })
  avatar: string;

  @ApiProperty({ example: 4, description: '用户 VIP 等级' })
  vipLevel: number;
}

export class ForumDynamicResponseDto {
  @ApiProperty({ example: 'D-5000' })
  id: string;

  @ApiProperty({ example: '昨晚在老码头蹲了两个小时，等到了想要的蓝调时刻。' })
  content: string;

  @ApiProperty({ type: [ForumMediaItemResponseDto] })
  media: ForumMediaItemResponseDto[];

  @ApiProperty({ type: ForumDynamicAuthorResponseDto })
  author: ForumDynamicAuthorResponseDto;

  @ApiProperty({ example: 2 })
  typeId: number;

  @ApiProperty({ example: '城市夜景' })
  typeName: string;

  @ApiProperty({ example: '城市夜景' })
  topic: string;

  @ApiProperty({ example: 1280 })
  likeCount: number;

  @ApiProperty({ example: 96 })
  commentCount: number;

  @ApiProperty({ example: 46 })
  favoriteCount: number;

  @ApiProperty({ example: 42 })
  shareCount: number;

  @ApiProperty({ example: false })
  liked: boolean;

  @ApiProperty({ example: false })
  favorited: boolean;

  @ApiProperty({ example: '2026-10-13T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: true })
  pinned: boolean;

  @ApiProperty({ example: 'approved', enum: ['pending', 'approved', 'rejected'] })
  auditStatus: 'pending' | 'approved' | 'rejected';

  @ApiProperty({ example: 1, description: '1 启用，0 下架' })
  enabled: number;
}

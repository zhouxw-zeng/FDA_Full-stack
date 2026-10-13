import { ApiProperty } from '@nestjs/swagger';

export class ForumChangeLogResponseDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'forum_dynamic' })
  targetType: string;

  @ApiProperty({ example: 'D-5000' })
  targetId: string;

  @ApiProperty({ example: '1' })
  ownerId: string;

  @ApiProperty({ example: '1' })
  editorId: string;

  @ApiProperty({ example: 'admin', enum: ['customer', 'admin'] })
  editorType: 'customer' | 'admin';

  @ApiProperty({ example: 'audit' })
  action: string;

  @ApiProperty({ example: '2026-10-13T08:00:00.000Z' })
  changedAt: Date;

  @ApiProperty({ example: '审核通过', nullable: true })
  remark: string | null;

  @ApiProperty({
    example: 'https://example.com/a.jpg',
    nullable: true,
    description: '附件链接文本',
  })
  attachments: string | null;
}

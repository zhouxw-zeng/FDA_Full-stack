import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class AuditForumDynamicDto {
  @ApiProperty({ example: 'D-5000', description: '动态记录 ID' })
  @IsString()
  @MaxLength(32)
  id: string;

  @ApiProperty({ example: 'approved', enum: ['approved', 'rejected'] })
  @IsIn(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @ApiPropertyOptional({ example: '内容审核通过', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/audit.png',
    description: '附件链接文本',
  })
  @IsOptional()
  @IsString()
  attachments?: string;
}

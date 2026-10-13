import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateForumChangeLogDto {
  @ApiProperty({ example: 'D-5000', description: '动态记录 ID' })
  @IsString()
  @MaxLength(32)
  targetId: string;

  @ApiProperty({ example: '1', description: '动态所属 C 端用户 ID' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/, {
    message: 'ownerId 必须是正整数',
  })
  ownerId: string;

  @ApiProperty({ example: '1', description: '编辑者 ID' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/, {
    message: 'editorId 必须是正整数',
  })
  editorId: string;

  @ApiProperty({ example: 'admin', enum: ['customer', 'admin'] })
  @IsIn(['customer', 'admin'])
  editorType: 'customer' | 'admin';

  @ApiProperty({ example: 'edit', description: '变更动作' })
  @IsString()
  @MaxLength(32)
  action: string;

  @ApiPropertyOptional({ example: '用户修改了动态内容', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/a.jpg,https://example.com/b.jpg',
    description: '附件链接文本，由前端自行拆分处理',
  })
  @IsOptional()
  @IsString()
  attachments?: string;
}

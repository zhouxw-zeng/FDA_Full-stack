import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateForumDynamicStatusDto {
  @ApiProperty({ example: 'D-5000', description: '动态记录 ID' })
  @IsString()
  @MaxLength(32)
  id: string;

  @ApiProperty({ example: 0, enum: [0, 1], description: '1 启用，0 下架' })
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  enabled: number;

  @ApiPropertyOptional({ example: '违反社区规范，执行下架', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;

  @ApiPropertyOptional({ example: 'https://example.com/evidence.png' })
  @IsOptional()
  @IsString()
  attachments?: string;
}

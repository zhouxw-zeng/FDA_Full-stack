import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAiSkillDto {
  @ApiProperty({ example: '图片短描述', maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  skillName: string;

  @ApiPropertyOptional({ example: '适用于图片短文本生成', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: '/local-files/document/2026-10-13/图片短描述.md',
    description: '本地文件上传接口返回的地址；传地址时可不重复上传文件',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fileUrl?: string;
}

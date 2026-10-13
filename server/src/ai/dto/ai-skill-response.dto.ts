import { ApiProperty } from '@nestjs/swagger';

export class AiSkillResponseDto {
  @ApiProperty({ example: '2' })
  id: string;

  @ApiProperty({ example: '图片短描述' })
  skillName: string;

  @ApiProperty({ example: '适用于图片短文本生成', nullable: true })
  description: string | null;

  @ApiProperty({ example: '图片短描述.md' })
  fileName: string;

  @ApiProperty({ example: '# 图片短描述\n\n请返回一段简短中文文本。' })
  fileContent: string;

  @ApiProperty({ example: '2026-10-13T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-13T08:00:00.000Z' })
  updatedAt: Date;
}

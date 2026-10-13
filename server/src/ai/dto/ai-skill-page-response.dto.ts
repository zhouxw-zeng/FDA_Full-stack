import { ApiProperty } from '@nestjs/swagger';
import { AiSkillResponseDto } from './ai-skill-response.dto';

export class AiSkillPageResponseDto {
  @ApiProperty({ type: [AiSkillResponseDto] })
  list: AiSkillResponseDto[];

  @ApiProperty({ example: 4 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 15 })
  size: number;

  @ApiProperty({ example: 15, deprecated: true })
  pageSize: number;
}

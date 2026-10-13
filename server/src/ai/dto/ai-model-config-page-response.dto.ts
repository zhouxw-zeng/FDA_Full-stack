import { ApiProperty } from '@nestjs/swagger';
import { AiModelConfigResponseDto } from './ai-model-config-response.dto';

export class AiModelConfigPageResponseDto {
  @ApiProperty({ type: [AiModelConfigResponseDto] })
  list: AiModelConfigResponseDto[];

  @ApiProperty({ example: 2 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 15 })
  size: number;

  @ApiProperty({ example: 15, deprecated: true })
  pageSize: number;
}

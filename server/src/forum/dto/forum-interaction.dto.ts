import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ForumInteractionDto {
  @ApiProperty({ example: 'D-6001' })
  @IsString()
  @MaxLength(32)
  dynamicId: string;

  @ApiProperty({ example: 'like', enum: ['like', 'unlike'] })
  @IsIn(['like', 'unlike'])
  action: 'like' | 'unlike';

  @ApiPropertyOptional({ example: 'client-request-id' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  requestId?: string;
}

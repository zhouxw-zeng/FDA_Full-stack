import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ForumFavoriteDto {
  @ApiProperty({ example: 'D-6001' })
  @IsString()
  @MaxLength(32)
  dynamicId: string;

  @ApiProperty({ example: 'favorite', enum: ['favorite', 'unfavorite'] })
  @IsIn(['favorite', 'unfavorite'])
  action: 'favorite' | 'unfavorite';

  @ApiPropertyOptional({ example: 'client-request-id' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  requestId?: string;
}

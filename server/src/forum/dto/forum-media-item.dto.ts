import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ForumMediaItemDto {
  @ApiProperty({ example: 'M-5000' })
  @IsString()
  @MaxLength(32)
  id: string;

  @ApiProperty({ example: 'album', enum: ['album', 'video'] })
  @IsIn(['album', 'video'])
  kind: 'album' | 'video';

  @ApiProperty({ example: '老码头蓝调时刻' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 1024 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  seed: number;

  @ApiPropertyOptional({ example: 86 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({ example: '/local-files/forum/dynamic/20261016-abc.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  url?: string;

  @ApiProperty({ example: 4280000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  size: number;
}

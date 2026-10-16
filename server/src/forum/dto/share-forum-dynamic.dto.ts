import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ShareForumDynamicDto {
  @ApiProperty({ example: 'D-6001' })
  @IsString()
  @MaxLength(32)
  dynamicId: string;

  @ApiPropertyOptional({ example: 'wechat' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  channel?: string;

  @ApiPropertyOptional({ example: 'share-request-id' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  requestId?: string;
}

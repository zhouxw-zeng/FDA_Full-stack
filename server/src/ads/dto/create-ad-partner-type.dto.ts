import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAdPartnerTypeDto {
  @ApiProperty({ example: '巨量引擎', maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  typeName: string;

  @ApiProperty({ example: 'OCEAN_ENGINE', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'typeCode 只能包含大写字母、数字和下划线',
  })
  typeCode: string;

  @ApiPropertyOptional({ example: '字节跳动广告平台', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string;

  @ApiPropertyOptional({
    example: 'https://open.oceanengine.com/',
    description: '第三方广告平台对接文档地址',
    maxLength: 500,
  })
  @IsOptional()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @MaxLength(500)
  integrationUrl?: string;

  @ApiPropertyOptional({ example: 0, enum: [0, 1], description: '0 启用，1 禁用' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  status?: number;

  @ApiPropertyOptional({ example: 1, enum: [0, 1], description: '1 需要第三方 Key' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  requiresKey?: number;

  @ApiPropertyOptional({ example: '', description: '第三方 Key ID，可留空后人工维护' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  keyId?: string;

  @ApiPropertyOptional({ example: '', description: '第三方 Key Secret，可留空后人工维护' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  keySecret?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDynamicTypeDto {
  @ApiProperty({ example: '城市夜景', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  typeName: string;

  @ApiPropertyOptional({ example: '城市夜景与灯光内容', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  typeRemark?: string;

  @ApiPropertyOptional({ example: 0, enum: [0, 1], description: '0 启用，1 禁用' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  status?: number;
}

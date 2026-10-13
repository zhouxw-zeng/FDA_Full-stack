import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateRouteDto {
  @ApiProperty({ example: '论坛审核', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  routeName: string;

  @ApiPropertyOptional({ example: 'DocumentChecked', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;

  @ApiProperty({ example: '/forum/audit', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  @Matches(/^\//, { message: 'routePath 必须以 / 开头' })
  routePath: string;

  @ApiPropertyOptional({
    example: '@/views/forum/audit/index.vue',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  componentPath?: string;

  @ApiPropertyOptional({ example: 2, nullable: true, description: '父路由 ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pid?: number | null;

  @ApiPropertyOptional({ example: 0, enum: [0, 1], description: '0 启用，1 禁用' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  status?: number;

  @ApiPropertyOptional({ example: 1, enum: [0, 1], description: '0 目录，1 菜单' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  routeType?: number;
}

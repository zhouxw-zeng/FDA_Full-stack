import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: '内容审核员', minLength: 2, maxLength: 50 })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  roleName: string;

  @ApiPropertyOptional({ example: '负责论坛内容和用户审核', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  roleRemark?: string;

  @ApiProperty({
    example: [1, 3, 13],
    description: '可访问的 admin_routes.route_id 路由 ID 组',
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  routeIdGroup: number[];
}

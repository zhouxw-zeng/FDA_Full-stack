import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'operator', minLength: 3, maxLength: 50 })
  @IsString()
  @Length(3, 50)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'username 只能包含字母、数字和下划线',
  })
  username: string;

  @ApiProperty({ example: 'operator@example.com' })
  @IsEmail()
  @MaxLength(100)
  email: string;

  @ApiProperty({ example: 'ChangeMe123!', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiProperty({ example: '内容运营', maxLength: 20 })
  @IsString()
  @MaxLength(20)
  nickname: string;

  @ApiProperty({ example: '2', description: '单一角色 ID' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/, {
    message: 'roleId 必须是正整数',
  })
  roleId: string;

  @ApiPropertyOptional({ example: '+86 13800138000', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^\+?[0-9\s-]{6,20}$/, {
    message: 'phone 格式不正确',
  })
  phone?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;

  @ApiPropertyOptional({ example: '内容运营部', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiPropertyOptional({ example: '负责社区内容审核。', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  bio?: string;

  @ApiPropertyOptional({ example: 1, enum: [0, 1], default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  status?: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: '登录接口返回的 refreshToken',
    example: '64 位十六进制字符串',
  })
  @IsString()
  @Length(64, 64)
  refreshToken: string;
}

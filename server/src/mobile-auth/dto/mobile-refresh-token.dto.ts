import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class MobileRefreshTokenDto {
  @ApiProperty({ description: '登录返回的 refreshToken' })
  @IsString()
  @Length(64, 64)
  refreshToken: string;
}

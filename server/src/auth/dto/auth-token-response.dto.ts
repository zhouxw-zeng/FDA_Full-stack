import { ApiProperty } from '@nestjs/swagger';
import { AuthUserDto } from './auth-user.dto';

export class AuthTokenResponseDto {
  @ApiProperty({ example: '64 位十六进制 accessToken' })
  accessToken: string;

  @ApiProperty({ example: '64 位十六进制 refreshToken' })
  refreshToken: string;

  @ApiProperty({ example: 7200, description: 'accessToken 剩余有效秒数' })
  accessExpiresIn: number;

  @ApiProperty({ example: 604800, description: 'refreshToken 剩余有效秒数' })
  refreshExpiresIn: number;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}

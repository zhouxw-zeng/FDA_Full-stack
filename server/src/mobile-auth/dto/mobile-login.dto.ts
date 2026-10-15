import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, MaxLength, MinLength } from 'class-validator';

export class MobileLoginDto {
  @ApiProperty({ example: '13810000001' })
  @IsString()
  @Length(11, 11)
  phone: string;

  @ApiProperty({ example: '123456', minLength: 6, maxLength: 72 })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SendCustomerMessageDto {
  @ApiProperty({ example: '8', description: '接收用户 ID' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/, {
    message: 'recipientId 必须是正整数',
  })
  recipientId: string;

  @ApiProperty({ example: '你好，想和你交流一下。' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content: string;

  @ApiPropertyOptional({ example: 'msg-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  requestId?: string;
}

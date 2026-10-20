import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class OpenConversationDto {
  @ApiProperty({ example: '8', description: '聊天对象用户 ID' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/, {
    message: 'targetUserId 必须是正整数',
  })
  targetUserId: string;
}

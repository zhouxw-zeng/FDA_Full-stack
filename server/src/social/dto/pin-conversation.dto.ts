import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class PinConversationDto {
  @ApiProperty({ example: true, description: '是否置顶会话' })
  @IsBoolean()
  pinned: boolean;
}

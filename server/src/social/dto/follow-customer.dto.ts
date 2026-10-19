import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class FollowCustomerDto {
  @ApiProperty({ example: '8', description: '被关注的用户 ID' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/, {
    message: 'targetUserId 必须是正整数',
  })
  targetUserId: string;
}

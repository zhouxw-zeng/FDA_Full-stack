import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Matches } from 'class-validator';

export class UpdateAdStatusDto {
  @ApiProperty({ example: '1', description: '广告计划 ID，从 Body 传入' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/, {
    message: 'id 必须是正整数',
  })
  id: string;

  @ApiProperty({ example: 'running', enum: ['running', 'paused', 'ended', 'draft'] })
  @IsIn(['running', 'paused', 'ended', 'draft'])
  status: 'running' | 'paused' | 'ended' | 'draft';
}

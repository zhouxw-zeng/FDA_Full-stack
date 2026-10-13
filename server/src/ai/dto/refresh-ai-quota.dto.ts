import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class RefreshAiQuotaDto {
  @ApiProperty({ example: '1', description: '额度账户 ID，从 Body 传入' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/, {
    message: 'id 必须是正整数',
  })
  id: string;

  @ApiPropertyOptional({ example: '手动刷新额度' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string;
}

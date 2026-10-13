import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export class UpdateAiQuotaDto {
  @ApiProperty({ example: '1', description: '额度账户 ID，从 Body 传入' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/, {
    message: 'id 必须是正整数',
  })
  id: string;

  @ApiPropertyOptional({ example: 1000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  quotaLimit?: number;

  @ApiPropertyOptional({ example: 'TOKEN' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ example: 'monthly', enum: ['manual', 'daily', 'monthly'] })
  @IsOptional()
  @IsIn(['manual', 'daily', 'monthly'])
  refreshStrategy?: 'manual' | 'daily' | 'monthly';
}

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsString, Matches } from 'class-validator';

export class UpdateCustomerStatusDto {
  @ApiProperty({ example: '1', description: 'C 端用户 ID，从 Body 传入' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/, {
    message: 'id 必须是正整数',
  })
  id: string;

  @ApiProperty({ example: 1, enum: [0, 1], description: '1 启用，0 禁用' })
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  enabled: number;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class AuditCustomerDto {
  @ApiProperty({ example: '1', description: 'C 端用户 ID，从 Body 传入' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/, {
    message: 'id 必须是正整数',
  })
  id: string;

  @ApiProperty({ example: 'approved', enum: ['approved', 'rejected'] })
  @IsIn(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @ApiPropertyOptional({ example: '资料审核通过', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string;
}

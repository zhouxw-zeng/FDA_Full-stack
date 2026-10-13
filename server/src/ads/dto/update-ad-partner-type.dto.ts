import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { CreateAdPartnerTypeDto } from './create-ad-partner-type.dto';

export class UpdateAdPartnerTypeDto extends PartialType(CreateAdPartnerTypeDto) {
  @ApiProperty({ example: '1', description: '要更新的对接方类型 ID，从 Body 传入' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/, {
    message: 'id 必须是正整数',
  })
  id: string;
}

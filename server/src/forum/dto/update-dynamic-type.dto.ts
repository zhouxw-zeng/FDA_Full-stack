import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { CreateDynamicTypeDto } from './create-dynamic-type.dto';

export class UpdateDynamicTypeDto extends PartialType(CreateDynamicTypeDto) {
  @ApiProperty({ example: 1, description: '要更新的动态类型 ID，从 Body 传入' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;
}

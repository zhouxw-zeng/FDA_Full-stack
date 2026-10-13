import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { CreateRouteDto } from './create-route.dto';

export class UpdateRouteDto extends PartialType(CreateRouteDto) {
  @ApiProperty({ example: 1, description: '要更新的路由 ID，从 Body 传入' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;
}

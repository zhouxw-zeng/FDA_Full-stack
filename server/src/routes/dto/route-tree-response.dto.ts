import { ApiProperty } from '@nestjs/swagger';
import { RouteResponseDto } from './route-response.dto';

export class RouteTreeResponseDto extends RouteResponseDto {
  @ApiProperty({ type: () => [RouteTreeResponseDto] })
  children: RouteTreeResponseDto[];
}

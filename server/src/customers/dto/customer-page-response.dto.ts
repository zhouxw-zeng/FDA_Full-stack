import { ApiProperty } from '@nestjs/swagger';
import { CustomerResponseDto } from './customer-response.dto';

export class CustomerPageResponseDto {
  @ApiProperty({ type: [CustomerResponseDto] })
  list: CustomerResponseDto[];

  @ApiProperty({ example: 3 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 15 })
  size: number;

  @ApiProperty({ example: 15, deprecated: true })
  pageSize: number;
}

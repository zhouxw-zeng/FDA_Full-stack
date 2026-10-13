import { ApiProperty } from '@nestjs/swagger';

export class DeleteForumDynamicResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'D-5000' })
  id: string;
}

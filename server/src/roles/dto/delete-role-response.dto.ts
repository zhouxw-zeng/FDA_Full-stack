import { ApiProperty } from '@nestjs/swagger';

export class DeleteRoleResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: '1' })
  roleId: string;
}

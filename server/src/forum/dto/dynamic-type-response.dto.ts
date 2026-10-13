import { ApiProperty } from '@nestjs/swagger';

export class DynamicTypeResponseDto {
  @ApiProperty({ example: 1 })
  typeId: number;

  @ApiProperty({ example: '城市夜景' })
  typeName: string;

  @ApiProperty({ example: '城市夜景与灯光内容', nullable: true })
  typeRemark: string | null;

  @ApiProperty({ example: 0, description: '0 启用，1 禁用' })
  status: number;

  @ApiProperty({ example: '2026-10-13T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-13T08:00:00.000Z' })
  updatedAt: Date;
}

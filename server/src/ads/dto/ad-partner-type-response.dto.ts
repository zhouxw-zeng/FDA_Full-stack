import { ApiProperty } from '@nestjs/swagger';

export class AdPartnerTypeResponseDto {
  @ApiProperty({ example: '2' })
  id: string;

  @ApiProperty({ example: '巨量引擎' })
  typeName: string;

  @ApiProperty({ example: 'OCEAN_ENGINE' })
  typeCode: string;

  @ApiProperty({ example: '字节跳动广告平台', nullable: true })
  remark: string | null;

  @ApiProperty({
    example: 'https://open.oceanengine.com/',
    nullable: true,
    description: '第三方广告平台对接文档地址',
  })
  integrationUrl: string | null;

  @ApiProperty({ example: 0, description: '0 启用，1 禁用' })
  status: number;

  @ApiProperty({ example: 1, description: '1 需要第三方 Key' })
  requiresKey: number;

  @ApiProperty({ example: '', nullable: true, description: '待人工维护' })
  keyId: string | null;

  @ApiProperty({ example: '', nullable: true, description: '待人工维护' })
  keySecret: string | null;

  @ApiProperty({ example: '2026-10-13T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-13T08:00:00.000Z' })
  updatedAt: Date;
}

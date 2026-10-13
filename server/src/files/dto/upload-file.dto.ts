import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadFileDto {
  @ApiPropertyOptional({
    example: 'avatar.png',
    description: '保存文件名，不传时使用上传文件的原始名称',
  })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  fileName?: string;

  @ApiPropertyOptional({
    example: 'user/avatar',
    description: '可选相对子地址，实际路径仍会先经过文件类型和上传日期目录',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  storageAddress?: string;

  @ApiPropertyOptional({
    example: false,
    description: '同名文件是否直接覆盖；默认 false，会自动追加序号避免覆盖',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  overwrite?: boolean;
}

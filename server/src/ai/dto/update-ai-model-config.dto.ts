import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { CreateAiModelConfigDto } from './create-ai-model-config.dto';

export class UpdateAiModelConfigDto extends PartialType(CreateAiModelConfigDto) {
  @ApiProperty({ example: '1', description: '要更新的模型配置 ID，从 Body 传入' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/, {
    message: 'id 必须是正整数',
  })
  id: string;
}

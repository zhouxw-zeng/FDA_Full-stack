import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { CreateAiSkillDto } from './create-ai-skill.dto';

export class UpdateAiSkillDto extends PartialType(CreateAiSkillDto) {
  @ApiProperty({ example: '1', description: '要更新的技能 ID，从 Body 传入' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/, {
    message: 'id 必须是正整数',
  })
  id: string;
}

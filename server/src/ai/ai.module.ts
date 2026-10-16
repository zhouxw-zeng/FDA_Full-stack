import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MobileAuthModule } from '../mobile-auth/mobile-auth.module';
import { AiChatGateway } from './ai-chat.gateway';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { AiModelsController } from './ai-models.controller';
import { AiModelsService } from './ai-models.service';
import { AiQuotaController } from './ai-quota.controller';
import { AiQuotaService } from './ai-quota.service';
import { AiSkillsController } from './ai-skills.controller';
import { AiSkillsService } from './ai-skills.service';
import { AiUsageController } from './ai-usage.controller';
import { AiUsageService } from './ai-usage.service';
import { AiChatMessage } from './entities/ai-chat-message.entity';
import { AiChatSession } from './entities/ai-chat-session.entity';
import { AiModelConfig } from './entities/ai-model-config.entity';
import { AiQuotaAccount } from './entities/ai-quota-account.entity';
import { AiSkill } from './entities/ai-skill.entity';
import { AiUsageRecord } from './entities/ai-usage-record.entity';
import { OpenAiCompatibleService } from './openai-compatible.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiModelConfig,
      AiChatSession,
      AiChatMessage,
      AiUsageRecord,
      AiQuotaAccount,
      AiSkill,
    ]),
    MobileAuthModule,
  ],
  controllers: [
    AiModelsController,
    AiSkillsController,
    AiChatController,
    AiUsageController,
    AiQuotaController,
  ],
  providers: [
    AiModelsService,
    AiSkillsService,
    AiChatService,
    AiChatGateway,
    AiUsageService,
    AiQuotaService,
    OpenAiCompatibleService,
  ],
  exports: [AiModelsService, OpenAiCompatibleService],
})
export class AiModule {}

import { BadGatewayException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AiModelsService } from './ai-models.service';
import { AiQuotaService } from './ai-quota.service';
import { AiUsageService } from './ai-usage.service';
import { AiModelConfig } from './entities/ai-model-config.entity';

export interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant';
  content:
    | string
    | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
}

export interface OpenAiCompletionResult {
  content: string;
  requestId: string | null;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: AiModelConfig;
}

interface OpenAiCompatibleResponse {
  id?: string;
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message?: string;
  };
}

@Injectable()
export class OpenAiCompatibleService {
  constructor(
    private readonly modelsService: AiModelsService,
    private readonly usageService: AiUsageService,
    private readonly quotaService: AiQuotaService,
  ) {}

  async complete(
    messages: OpenAiMessage[],
    scene: string,
    adminUserId?: string,
    modelConfigId?: string,
  ): Promise<OpenAiCompletionResult> {
    const model = await this.modelsService.getRuntimeConfig(modelConfigId);

    if (!model.apiKey) {
      throw new ServiceUnavailableException(
        `AI 模型 ${model.providerName}/${model.modelName} 尚未配置 API Key`,
      );
    }

    const finalMessages: OpenAiMessage[] = messages.some((message) => message.role === 'system')
      ? messages
      : [
          {
            role: 'system',
            content: this.modelsService.buildSystemPrompt(model),
          },
          ...messages,
        ];

    const startedAt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), model.timeoutMs);
    let requestRecorded = false;

    try {
      const response = await fetch(this.buildChatCompletionsUrl(model.baseUrl), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${model.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model.modelName,
          messages: finalMessages,
          max_tokens: model.maxTokens,
          temperature: model.temperature,
          stream: false,
        }),
        signal: controller.signal,
      });

      const rawText = await response.text();
      const payload = rawText ? (JSON.parse(rawText) as OpenAiCompatibleResponse) : {};
      const latencyMs = Date.now() - startedAt;

      if (!response.ok) {
        const message = payload.error?.message ?? `AI 接口请求失败，HTTP ${response.status}`;
        await this.usageService.record({
          modelConfigId: model.id,
          providerCode: model.providerCode,
          modelName: model.modelName,
          scene,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          latencyMs,
          status: 'failed',
          errorMessage: message,
          adminUserId,
        });
        requestRecorded = true;
        throw new BadGatewayException(message);
      }

      const content = payload.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new BadGatewayException('AI 接口未返回有效内容');
      }

      const usage = {
        promptTokens: Number(payload.usage?.prompt_tokens ?? 0),
        completionTokens: Number(payload.usage?.completion_tokens ?? 0),
        totalTokens: Number(payload.usage?.total_tokens ?? 0),
      };

      await this.usageService.record({
        modelConfigId: model.id,
        providerCode: model.providerCode,
        modelName: model.modelName,
        scene,
        requestId: payload.id,
        ...usage,
        latencyMs,
        status: 'success',
        adminUserId,
      });
      await this.quotaService.addUsage(model.providerCode, usage.totalTokens);
      requestRecorded = true;

      return {
        content,
        requestId: payload.id ?? null,
        usage,
        model,
      };
    } catch (error) {
      if (!requestRecorded) {
        await this.usageService.record({
          modelConfigId: model.id,
          providerCode: model.providerCode,
          modelName: model.modelName,
          scene,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          latencyMs: Date.now() - startedAt,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'AI 调用失败',
          adminUserId,
        });
      }

      if (error instanceof BadGatewayException) {
        throw error;
      }

      throw new BadGatewayException(error instanceof Error ? error.message : 'AI 接口调用失败');
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildChatCompletionsUrl(baseUrl: string): string {
    return `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  }
}

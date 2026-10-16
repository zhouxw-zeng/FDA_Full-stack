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

export type OpenAiStreamEvent =
  { type: 'delta'; content: string } | { type: 'done'; result: OpenAiCompletionResult };

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

interface OpenAiCompatibleStreamChunk {
  id?: string;
  choices?: Array<{
    delta?: {
      content?: string;
    };
    finish_reason?: string | null;
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
    customerId?: string,
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
          customerId,
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
        customerId,
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
          customerId,
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

  async *stream(
    messages: OpenAiMessage[],
    scene: string,
    customerId?: string,
    modelConfigId?: string,
  ): AsyncGenerator<OpenAiStreamEvent, void, void> {
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
    let content = '';
    let requestId: string | null = null;
    let usage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };

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
          stream: true,
          stream_options: {
            include_usage: true,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const rawText = await response.text();
        const payload = this.parsePayload(rawText);
        const message = payload.error?.message ?? `AI 接口请求失败，HTTP ${response.status}`;
        await this.recordFailure(model, scene, customerId, startedAt, message);
        requestRecorded = true;
        throw new BadGatewayException(message);
      }

      if (!response.body) {
        throw new BadGatewayException('AI 流式响应体为空');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamFinished = false;

      while (!streamFinished) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const parsed = this.parseStreamLine(line);
          if (!parsed) {
            continue;
          }
          if (parsed === 'done') {
            streamFinished = true;
            break;
          }

          if (parsed.error?.message) {
            throw new BadGatewayException(parsed.error.message);
          }

          requestId = requestId ?? parsed.id ?? null;
          if (parsed.usage) {
            usage = {
              promptTokens: Number(parsed.usage.prompt_tokens ?? 0),
              completionTokens: Number(parsed.usage.completion_tokens ?? 0),
              totalTokens: Number(parsed.usage.total_tokens ?? 0),
            };
          }

          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            content += delta;
            yield { type: 'delta', content: delta };
          }
        }
      }

      if (!content.trim()) {
        throw new BadGatewayException('AI 接口未返回有效内容');
      }

      const latencyMs = Date.now() - startedAt;
      await this.usageService.record({
        modelConfigId: model.id,
        providerCode: model.providerCode,
        modelName: model.modelName,
        scene,
        requestId,
        ...usage,
        latencyMs,
        status: 'success',
        customerId,
      });
      await this.quotaService.addUsage(model.providerCode, usage.totalTokens);
      requestRecorded = true;

      yield {
        type: 'done',
        result: {
          content,
          requestId,
          usage,
          model,
        },
      };
    } catch (error) {
      if (!requestRecorded) {
        await this.recordFailure(
          model,
          scene,
          customerId,
          startedAt,
          error instanceof Error ? error.message : 'AI 流式调用失败',
        );
      }

      if (error instanceof BadGatewayException) {
        throw error;
      }

      throw new BadGatewayException(error instanceof Error ? error.message : 'AI 流式调用失败');
    } finally {
      clearTimeout(timeout);
    }
  }

  private async recordFailure(
    model: AiModelConfig,
    scene: string,
    customerId: string | undefined,
    startedAt: number,
    errorMessage: string,
  ): Promise<void> {
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
      errorMessage,
      customerId,
    });
  }

  private parsePayload(rawText: string): OpenAiCompatibleResponse {
    if (!rawText) {
      return {};
    }

    try {
      return JSON.parse(rawText) as OpenAiCompatibleResponse;
    } catch {
      return {};
    }
  }

  private parseStreamLine(line: string): OpenAiCompatibleStreamChunk | 'done' | null {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) {
      return null;
    }

    const data = trimmed.slice(5).trim();
    if (!data) {
      return null;
    }
    if (data === '[DONE]') {
      return 'done';
    }

    try {
      return JSON.parse(data) as OpenAiCompatibleStreamChunk;
    } catch {
      return null;
    }
  }

  private buildChatCompletionsUrl(baseUrl: string): string {
    return `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  }
}

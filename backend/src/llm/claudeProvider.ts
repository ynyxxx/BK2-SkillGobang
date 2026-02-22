/**
 * Anthropic Claude API 提供者
 * 支持 claude-3-5-sonnet, claude-3-haiku 等模型
 */

import { LLMProvider, LLMMessage, LLMResponse, LLMConfig } from './llmProvider';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class ClaudeProvider extends LLMProvider {
  constructor(config: Partial<LLMConfig> & { apiKey: string }) {
    super({
      model: 'claude-haiku-4-5-20251001',
      baseUrl: 'https://api.anthropic.com',
      temperature: 0.3,
      maxTokens: 1024,
      ...config,
    });
  }

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    // 分离 system 消息
    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages: ClaudeMessage[] = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const body: Record<string, unknown> = {
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      messages: chatMessages,
    };

    if (systemMessage) {
      body.system = systemMessage.content;
    }

    if (this.config.temperature !== undefined) {
      body.temperature = this.config.temperature;
    }

    const response = await fetch(`${this.config.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API error ${response.status}: ${err}`);
    }

    const data = await response.json() as {
      content: { type: string; text: string }[];
      model: string;
      usage?: { input_tokens: number; output_tokens: number };
    };

    const textContent = data.content.find(c => c.type === 'text');

    return {
      content: textContent?.text || '',
      model: data.model,
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
      } : undefined,
    };
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey;
  }
}

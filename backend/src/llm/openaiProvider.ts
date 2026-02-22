/**
 * OpenAI API 提供者
 * 支持 GPT-4, GPT-3.5-turbo 等模型
 * 也可通过 baseUrl 接入兼容 OpenAI 协议的其他服务（如 DeepSeek、Moonshot 等）
 */

import { LLMProvider, LLMMessage, LLMResponse, LLMConfig } from './llmProvider';

export class OpenAIProvider extends LLMProvider {
  constructor(config: Partial<LLMConfig> & { apiKey: string }) {
    super({
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com/v1',
      temperature: 0.3,
      maxTokens: 1024,
      ...config,
    });
  }

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const url = `${this.config.baseUrl}/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${err}`);
    }

    const data = await response.json() as {
      choices: { message: { content: string } }[];
      model: string;
      usage?: { prompt_tokens: number; completion_tokens: number };
    };

    return {
      content: data.choices[0].message.content,
      model: data.model,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
      } : undefined,
    };
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey;
  }
}

/**
 * DeepSeek 提供者（兼容 OpenAI 协议）
 */
export class DeepSeekProvider extends OpenAIProvider {
  constructor(config: { apiKey: string; model?: string }) {
    super({
      apiKey: config.apiKey,
      model: config.model || 'deepseek-chat',
      baseUrl: 'https://api.deepseek.com/v1',
    });
  }
}

/**
 * 通用 OpenAI 兼容提供者（适配各种国产模型）
 */
export class OpenAICompatProvider extends OpenAIProvider {
  constructor(config: { apiKey: string; baseUrl: string; model: string }) {
    super(config);
  }
}

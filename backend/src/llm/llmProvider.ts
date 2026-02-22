/**
 * LLM 提供者基础接口
 * 支持多种 API 接入方式：OpenAI、Anthropic Claude、Ollama
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface LLMConfig {
  apiKey?: string;
  baseUrl?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * LLM 提供者抽象基类
 */
export abstract class LLMProvider {
  protected config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = {
      temperature: 0.3,
      maxTokens: 1024,
      ...config,
    };
  }

  abstract chat(messages: LLMMessage[]): Promise<LLMResponse>;

  abstract isAvailable(): Promise<boolean>;

  get name(): string {
    return this.constructor.name;
  }

  get model(): string {
    return this.config.model;
  }
}

/**
 * LLM 提供者注册表
 */
export class LLMProviderRegistry {
  private providers: Map<string, LLMProvider> = new Map();

  register(key: string, provider: LLMProvider): void {
    this.providers.set(key, provider);
  }

  get(key: string): LLMProvider | undefined {
    return this.providers.get(key);
  }

  list(): string[] {
    return Array.from(this.providers.keys());
  }

  async getAvailable(): Promise<string[]> {
    const available: string[] = [];
    for (const [key, provider] of this.providers) {
      try {
        if (await provider.isAvailable()) {
          available.push(key);
        }
      } catch {
        // ignore
      }
    }
    return available;
  }
}

/**
 * Ollama 本地模型提供者
 * 支持本地运行的开源模型：llama3, qwen2, gemma3 等
 * 需要先安装并启动 Ollama: https://ollama.ai
 */

import { LLMProvider, LLMMessage, LLMResponse, LLMConfig } from './llmProvider';

export class OllamaProvider extends LLMProvider {
  constructor(config: Partial<LLMConfig> & { model: string }) {
    super({
      baseUrl: 'http://localhost:11434',
      temperature: 0.3,
      maxTokens: 1024,
      ...config,
    });
  }

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const url = `${this.config.baseUrl}/api/chat`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        stream: false,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Ollama API error ${response.status}: ${err}`);
    }

    const data = await response.json() as {
      message: { content: string };
      model: string;
      eval_count?: number;
      prompt_eval_count?: number;
    };

    return {
      content: data.message.content,
      model: data.model,
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
      },
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!response.ok) return false;

      // 检查目标模型是否已安装
      const data = await response.json() as { models: { name: string }[] };
      const modelName = this.config.model.split(':')[0];
      return data.models.some(m => m.name.startsWith(modelName));
    } catch {
      return false;
    }
  }

  /**
   * 获取 Ollama 中已安装的模型列表
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`);
      if (!response.ok) return [];
      const data = await response.json() as { models: { name: string }[] };
      return data.models.map(m => m.name);
    } catch {
      return [];
    }
  }
}

import type { LLMProvider, ChatMessage, ChatOptions, ChatResponse, StreamChunk, ProviderConfig } from './types';
import { AVAILABLE_MODELS } from './types';

interface NvidiaMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
}

interface NvidiaChatRequest {
  model: string;
  messages: NvidiaMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  chat_template_kwargs?: Record<string, unknown>;
}

interface NvidiaChatChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

interface NvidiaChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: NvidiaChatChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface NvidiaStreamDelta {
  role?: string;
  content?: string;
}

interface NvidiaStreamChoice {
  index: number;
  delta: NvidiaStreamDelta;
  finish_reason: string | null;
}

interface NvidiaStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: NvidiaStreamChoice[];
}

export class NvidiaNimProvider implements LLMProvider {
  readonly name = 'NVIDIA NIM API';
  readonly type = 'nvidia-nim' as const;

  private apiKey: string | null = null;
  private baseUrl: string;
  private timeout: number;

  constructor(config: ProviderConfig = {}) {
    this.apiKey = config.apiKey || process.env.NVIDIA_API_KEY || null;
    this.baseUrl = config.baseUrl || 'https://integrate.api.nvidia.com/v1';
    this.timeout = config.timeout || 60000;
  }

  private validateApiKey(): void {
    if (!this.apiKey) {
      throw new Error('NVIDIA_API_KEY non configurée. Veuillez ajouter la clé API dans les variables d\'environnement.');
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    body: NvidiaChatRequest
  ): Promise<T> {
    this.validateApiKey();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Erreur NVIDIA NIM (${response.status})`;
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message) {
            errorMessage = errorJson.error.message;
          }
        } catch {
          if (errorText) errorMessage = errorText;
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Timeout: la requête NVIDIA NIM a pris trop de temps');
        }
        throw error;
      }
      
      throw new Error('Erreur inconnue lors de l\'appel à NVIDIA NIM');
    }
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    const {
      temperature = 0.7,
      maxTokens = 1024,
      systemPrompt,
      model = 'google/gemma-4-31b-it',
      topP,
    } = options;

    const nvidiaMessages: NvidiaMessage[] = systemPrompt
      ? [
          { role: 'system', content: systemPrompt },
          ...messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ]
      : messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

    const body: NvidiaChatRequest = {
      model,
      messages: nvidiaMessages,
      max_tokens: maxTokens,
      temperature,
      stream: false,
    };

    if (topP !== undefined) {
      body.top_p = topP;
    }

    const response = await this.makeRequest<NvidiaChatResponse>('/chat/completions', body);

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Aucune réponse générée par NVIDIA NIM.');
    }

    return {
      content,
      model: response.model,
      provider: 'nvidia-nim',
      timestamp: new Date().toISOString(),
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }

  async chatStream(
    messages: ChatMessage[],
    options: ChatOptions = {},
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<ChatResponse> {
    const {
      temperature = 0.7,
      maxTokens = 1024,
      systemPrompt,
      model = 'google/gemma-4-31b-it',
      topP,
    } = options;

    this.validateApiKey();

    const nvidiaMessages: NvidiaMessage[] = systemPrompt
      ? [
          { role: 'system', content: systemPrompt },
          ...messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ]
      : messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

    const body: NvidiaChatRequest = {
      model,
      messages: nvidiaMessages,
      max_tokens: maxTokens,
      temperature,
      stream: true,
      ...(topP !== undefined && { top_p: topP }),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur NVIDIA NIM (${response.status}): ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Impossible de lire le flux de réponse');
      }

      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          
          if (!trimmedLine || !trimmedLine.startsWith('data:')) continue;
          
          const data = trimmedLine.slice(5).trim();
          
          if (data === '[DONE]') {
            onChunk?.({
              delta: '',
              model,
              provider: 'nvidia-nim',
              finished: true,
            });
            continue;
          }

          try {
            const parsed: NvidiaStreamResponse = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            
            if (delta) {
              fullContent += delta;
              onChunk?.({
                delta,
                model: parsed.model || model,
                provider: 'nvidia-nim',
                finished: false,
              });
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      return {
        content: fullContent,
        model,
        provider: 'nvidia-nim',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Timeout: la requête NVIDIA NIM a pris trop de temps');
      }
      
      throw error;
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  getAvailableModels(): string[] {
    return AVAILABLE_MODELS
      .filter(m => m.provider === 'nvidia-nim')
      .map(m => m.id);
  }
}

let instance: NvidiaNimProvider | null = null;

export function getNvidiaNimProvider(): NvidiaNimProvider {
  if (!instance) {
    instance = new NvidiaNimProvider();
  }
  return instance;
}

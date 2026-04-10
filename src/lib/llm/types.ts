export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  model?: string;
  stream?: boolean;
  topP?: number;
}

export interface ChatResponse {
  content: string;
  model: string;
  provider: string;
  timestamp: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamChunk {
  delta: string;
  model: string;
  provider: string;
  finished: boolean;
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
}

export type ProviderType = 'nvidia-nim';

export interface LLMProvider {
  readonly name: string;
  readonly type: ProviderType;

  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;

  chatStream?(
    messages: ChatMessage[],
    options?: ChatOptions,
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<ChatResponse>;

  isAvailable(): boolean;

  getAvailableModels(): string[];
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: ProviderType;
  maxTokens: number;
  supportsStreaming: boolean;
  description?: string;
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: 'google/gemma-4-31b-it',
    name: 'Gemma 4 (31B)',
    provider: 'nvidia-nim',
    maxTokens: 8192,
    supportsStreaming: true,
    description: 'Gemma 4 via NVIDIA NIM API',
  },
  {
    id: 'meta/llama-3.1-70b-instruct',
    name: 'Llama 3.1 (70B)',
    provider: 'nvidia-nim',
    maxTokens: 4096,
    supportsStreaming: true,
    description: 'Llama 3.1 70B via NVIDIA NIM',
  },
  {
    id: 'mistralai/mistral-large',
    name: 'Mistral Large',
    provider: 'nvidia-nim',
    maxTokens: 4096,
    supportsStreaming: true,
    description: 'Mistral Large via NVIDIA NIM',
  },
  {
    id: 'nvidia/z-ai/glm5',
    name: 'GLM-5',
    provider: 'nvidia-nim',
    maxTokens: 8192,
    supportsStreaming: true,
    description: 'GLM-5 via NVIDIA NIM - Modèle multilingue avancé',
  },
];

export const DEFAULT_MODEL = 'nvidia/z-ai/glm5';
export const DEFAULT_PROVIDER: ProviderType = 'nvidia-nim';

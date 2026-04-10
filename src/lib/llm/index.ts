import type { LLMProvider, ChatMessage, ChatOptions, ChatResponse, StreamChunk, ProviderType } from './types';
import { AVAILABLE_MODELS, DEFAULT_MODEL, DEFAULT_PROVIDER } from './types';
import { getNvidiaNimProvider } from './nvidia-nim-provider';

class LLMProviderFactory {
  private providers: Map<ProviderType, LLMProvider> = new Map();
  private modelToProvider: Map<string, ProviderType> = new Map();

  constructor() {
    this.providers.set('nvidia-nim', getNvidiaNimProvider());

    for (const model of AVAILABLE_MODELS) {
      this.modelToProvider.set(model.id, model.provider);
    }
  }

  getProvider(provider: ProviderType): LLMProvider {
    const p = this.providers.get(provider);
    if (!p) {
      throw new Error(`Provider inconnu: ${provider}`);
    }
    return p;
  }

  getProviderForModel(modelId: string): LLMProvider {
    const providerType = this.modelToProvider.get(modelId);

    if (!providerType) {
      console.warn(`[LLMProviderFactory] Modèle inconnu "${modelId}", utilisation du provider par défaut`);
      return this.getProvider(DEFAULT_PROVIDER);
    }

    const provider = this.providers.get(providerType);

    if (!provider) {
      console.warn(`[LLMProviderFactory] Provider "${providerType}" non disponible, utilisation du provider par défaut`);
      return this.getProvider(DEFAULT_PROVIDER);
    }

    if (!provider.isAvailable()) {
      console.warn(`[LLMProviderFactory] Provider "${providerType}" non disponible, utilisation du provider par défaut`);
      return this.getProvider(DEFAULT_PROVIDER);
    }

    return provider;
  }

  async chat(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): Promise<ChatResponse> {
    const modelId = options.model || DEFAULT_MODEL;
    const provider = this.getProviderForModel(modelId);

    return provider.chat(messages, { ...options, model: modelId });
  }

  async chatStream(
    messages: ChatMessage[],
    options: ChatOptions = {},
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<ChatResponse> {
    const modelId = options.model || DEFAULT_MODEL;
    const provider = this.getProviderForModel(modelId);

    if (provider.chatStream) {
      return provider.chatStream(messages, { ...options, model: modelId }, onChunk);
    }

    const response = await provider.chat(messages, { ...options, model: modelId });

    if (onChunk) {
      onChunk({
        delta: response.content,
        model: response.model,
        provider: response.provider,
        finished: false,
      });
      onChunk({
        delta: '',
        model: response.model,
        provider: response.provider,
        finished: true,
      });
    }

    return response;
  }

  getAvailableModels(): typeof AVAILABLE_MODELS {
    return AVAILABLE_MODELS;
  }

  getAvailableModelsForProvider(providerType: ProviderType): typeof AVAILABLE_MODELS {
    return AVAILABLE_MODELS.filter(m => m.provider === providerType);
  }

  isProviderAvailable(providerType: ProviderType): boolean {
    const provider = this.providers.get(providerType);
    return provider ? provider.isAvailable() : false;
  }

  getDefaultModel(): string {
    return DEFAULT_MODEL;
  }

  validateModel(modelId: string): boolean {
    return this.modelToProvider.has(modelId);
  }
}

let factoryInstance: LLMProviderFactory | null = null;

export function getLLMProviderFactory(): LLMProviderFactory {
  if (!factoryInstance) {
    factoryInstance = new LLMProviderFactory();
  }
  return factoryInstance;
}

export async function llmChat(
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<ChatResponse> {
  return getLLMProviderFactory().chat(messages, options);
}

export async function llmChatStream(
  messages: ChatMessage[],
  options?: ChatOptions,
  onChunk?: (chunk: StreamChunk) => void
): Promise<ChatResponse> {
  return getLLMProviderFactory().chatStream(messages, options, onChunk);
}

export { type LLMProvider };

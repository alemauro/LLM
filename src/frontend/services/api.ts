import { DualLLMRequest, DualLLMResponse, Statistics, ModelsResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface StreamCallbacks {
  onOpenAIChunk?: (chunk: string) => void;
  onAnthropicChunk?: (chunk: string) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
}

export const api = {
  async generateDualResponse(request: DualLLMRequest): Promise<DualLLMResponse> {
    const response = await fetch(`${API_BASE_URL}/api/llm/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    return response.json();
  },

  async streamResponse(
    request: { 
      prompt: string; 
      provider: 'openai' | 'anthropic' | 'dual'; 
      model?: string; 
      temperature?: number;
      openaiModel?: string;
      anthropicModel?: string;
      openaiTemperature?: number;
      anthropicTemperature?: number;
      fileIds?: string[];
    },
    callbacks: StreamCallbacks
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/llm/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No reader available');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim()) {
              try {
                const parsed = JSON.parse(data);
                
                if (parsed.error) {
                  callbacks.onError?.(parsed.error);
                } else if (parsed.done) {
                  callbacks.onComplete?.();
                } else {
                  if (request.provider === 'dual') {
                    if (parsed.openai) {
                      callbacks.onOpenAIChunk?.(parsed.openai);
                    }
                    if (parsed.anthropic) {
                      callbacks.onAnthropicChunk?.(parsed.anthropic);
                    }
                  } else if (parsed.content) {
                    if (parsed.provider === 'openai') {
                      callbacks.onOpenAIChunk?.(parsed.content);
                    } else if (parsed.provider === 'anthropic') {
                      callbacks.onAnthropicChunk?.(parsed.content);
                    }
                  }
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  async getModels(): Promise<ModelsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/llm/models`);
    return response.json();
  },

  async getStatistics(): Promise<Statistics> {
    const response = await fetch(`${API_BASE_URL}/api/statistics`);
    const data = await response.json();
    return data.data;
  },
};
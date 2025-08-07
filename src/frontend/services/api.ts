import { DualLLMRequest, DualLLMResponse, Statistics, ModelsResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface StreamCallbacks {
  onOpenAIChunk?: (chunk: string) => void;
  onAnthropicChunk?: (chunk: string) => void;
  onFirstChunk?: (chunk: string) => void;
  onSecondChunk?: (chunk: string) => void;
  onFilesInfo?: (files: Array<{ name: string; type: 'image' | 'pdf' }>) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
}

export const api = {
  async generateDualResponse(request: DualLLMRequest, signal?: AbortSignal): Promise<DualLLMResponse> {
    const response = await fetch(`${API_BASE_URL}/api/llm/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal
    });
    return response.json();
  },

  async streamResponse(
    request: { 
      prompt: string; 
      provider: 'openai' | 'anthropic' | 'gemini' | 'grok' | 'dual'; 
      model?: string; 
      temperature?: number;
      firstProvider?: 'openai' | 'gemini';
      secondProvider?: 'anthropic' | 'grok';
      openaiModel?: string;
      geminiModel?: string;
      anthropicModel?: string;
      grokModel?: string;
      openaiTemperature?: number;
      geminiTemperature?: number;
      anthropicTemperature?: number;
      grokTemperature?: number;
      fileIds?: string[];
    },
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/llm/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal
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
        if (signal?.aborted) {
          throw new DOMException('Request aborted', 'AbortError');
        }
        
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
                } else if (parsed.type === 'files_info') {
                  callbacks.onFilesInfo?.(parsed.files);
                } else {
                  if (request.provider === 'dual') {
                    // Support both old format (openai/anthropic) and new format (first/second)
                    if (parsed.openai) {
                      callbacks.onOpenAIChunk?.(parsed.openai);
                      callbacks.onFirstChunk?.(parsed.openai);
                    }
                    if (parsed.anthropic) {
                      callbacks.onAnthropicChunk?.(parsed.anthropic);
                      callbacks.onSecondChunk?.(parsed.anthropic);
                    }
                    if (parsed.first) {
                      callbacks.onFirstChunk?.(parsed.first);
                    }
                    if (parsed.second) {
                      callbacks.onSecondChunk?.(parsed.second);
                    }
                  } else if (parsed.content) {
                    if (parsed.provider === 'openai') {
                      callbacks.onOpenAIChunk?.(parsed.content);
                      callbacks.onFirstChunk?.(parsed.content);
                    } else if (parsed.provider === 'anthropic') {
                      callbacks.onAnthropicChunk?.(parsed.content);
                      callbacks.onSecondChunk?.(parsed.content);
                    } else if (parsed.provider === 'gemini') {
                      callbacks.onFirstChunk?.(parsed.content);
                    } else if (parsed.provider === 'grok') {
                      callbacks.onSecondChunk?.(parsed.content);
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
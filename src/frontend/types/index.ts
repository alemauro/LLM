export interface DualLLMRequest {
  prompt: string;
  firstProvider?: 'openai' | 'gemini';
  openaiModel?: string;
  geminiModel?: string;
  openaiTemperature?: number;
  geminiTemperature?: number;
  secondProvider?: 'anthropic' | 'grok';
  anthropicModel?: string;
  grokModel?: string;
  anthropicTemperature?: number;
  grokTemperature?: number;
}

export interface DualLLMResponse {
  success: boolean;
  data?: {
    first: {
      provider: 'openai' | 'gemini';
      response: string;
      model: string;
      temperature: number;
      attachedFiles?: Array<{
        name: string;
        type: 'image' | 'pdf';
      }>;
    };
    second: {
      provider: 'anthropic' | 'grok';
      response: string;
      model: string;
      temperature: number;
      attachedFiles?: Array<{
        name: string;
        type: 'image' | 'pdf';
      }>;
    };
  };
  error?: string;
}

export interface Statistics {
  promptCount: number;
  lastUpdated: string;
}

export interface ModelsResponse {
  success: boolean;
  data?: {
    openai: string[];
    gemini: string[];
    anthropic: string[];
    grok: string[];
  };
}
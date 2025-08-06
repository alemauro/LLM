export interface DualLLMRequest {
  prompt: string;
  openaiModel?: string;
  anthropicModel?: string;
  openaiTemperature?: number;
  anthropicTemperature?: number;
}

export interface DualLLMResponse {
  success: boolean;
  data?: {
    openai: {
      response: string;
      model: string;
      temperature: number;
      attachedFiles?: Array<{
        name: string;
        type: 'image' | 'pdf';
      }>;
    };
    anthropic: {
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
    anthropic: string[];
  };
}
export interface FileAttachment {
  id: string;
  name: string;
  type: 'image' | 'pdf';
  base64?: string;
  text?: string;
}

export interface LLMRequest {
  prompt: string;
  temperature?: number;
  model?: string;
  files?: FileAttachment[];
}

export interface LLMResponse {
  success: boolean;
  data?: {
    response: string;
    model: string;
    temperature: number;
    filesProcessed?: boolean;
    fileWarnings?: string[];
    attachedFiles?: Array<{
      name: string;
      type: 'image' | 'pdf';
    }>;
  };
  error?: string;
}

export interface DualLLMRequest {
  prompt: string;
  // First box models (OpenAI or Gemini)
  firstProvider?: 'openai' | 'gemini';
  openaiModel?: string;
  geminiModel?: string;
  openaiTemperature?: number;
  geminiTemperature?: number;
  // Second box models (Anthropic or Grok)
  secondProvider?: 'anthropic' | 'grok';
  anthropicModel?: string;
  grokModel?: string;
  anthropicTemperature?: number;
  grokTemperature?: number;
  // Legacy compatibility
  fileIds?: string[];
}

export interface DualLLMResponse {
  success: boolean;
  data?: {
    first: {
      provider: 'openai' | 'gemini';
      response: string;
      model: string;
      temperature: number;
      filesProcessed?: boolean;
      fileWarnings?: string[];
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
      filesProcessed?: boolean;
      fileWarnings?: string[];
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

export interface StatisticsData {
  promptCount: number;
  lastUpdated: Date;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  environment: string;
  message: string;
}
export interface LLMRequest {
  prompt: string;
  temperature?: number;
  model?: string;
}

export interface LLMResponse {
  success: boolean;
  data?: {
    response: string;
    model: string;
    temperature: number;
  };
  error?: string;
}

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
    };
    anthropic: {
      response: string;
      model: string;
      temperature: number;
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
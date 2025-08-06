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
  openaiModel?: string;
  anthropicModel?: string;
  openaiTemperature?: number;
  anthropicTemperature?: number;
  fileIds?: string[];
}

export interface DualLLMResponse {
  success: boolean;
  data?: {
    openai: {
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
    anthropic: {
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
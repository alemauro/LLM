// Frontend model capabilities utilities
export interface ModelCapabilities {
  supportsVision: boolean;
  supportsPDF: boolean;
  maxImageSize?: number;
  maxPDFSize?: number;
  supportedImageFormats?: string[];
}

export const MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
  // OpenAI Models
  'gpt-4o-mini-2024-07-18': {
    supportsVision: true,
    supportsPDF: false,
    maxImageSize: 20,
    supportedImageFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp']
  },
  'gpt-3.5-turbo-0125': {
    supportsVision: false,
    supportsPDF: false
  },
  
  // Gemini Models
  'gemini-2.0-flash-lite': {
    supportsVision: true,
    supportsPDF: true,
    maxImageSize: 10,
    maxPDFSize: 20,
    supportedImageFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp']
  },
  'gemini-2.0-flash': {
    supportsVision: true,
    supportsPDF: true,
    maxImageSize: 15,
    maxPDFSize: 30,
    supportedImageFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp']
  },
  
  // Anthropic Models
  'claude-3-5-haiku-latest': {
    supportsVision: true,
    supportsPDF: true,
    maxImageSize: 5,
    maxPDFSize: 10,
    supportedImageFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp']
  },
  'claude-3-5-sonnet-20240620': {
    supportsVision: true,
    supportsPDF: true,
    maxImageSize: 5,
    maxPDFSize: 10,
    supportedImageFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp']
  },
  
  // Grok Models
  'grok-3-mini-fast': {
    supportsVision: false,
    supportsPDF: true,
    maxPDFSize: 25,
    supportedImageFormats: []
  },
  'grok-2-vision-1212': {
    supportsVision: true,
    supportsPDF: true,
    maxImageSize: 20,
    maxPDFSize: 25,
    supportedImageFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp']
  }
};

export function getModelCapabilities(model: string): ModelCapabilities {
  return MODEL_CAPABILITIES[model] || {
    supportsVision: false,
    supportsPDF: false
  };
}

export function getProviderModels(provider: 'openai' | 'gemini' | 'anthropic' | 'grok'): string[] {
  const models = Object.keys(MODEL_CAPABILITIES);
  
  switch (provider) {
    case 'openai':
      return models.filter(model => model.startsWith('gpt-'));
    case 'gemini':
      return models.filter(model => model.startsWith('gemini-'));
    case 'anthropic':
      return models.filter(model => model.startsWith('claude-'));
    case 'grok':
      return models.filter(model => model.startsWith('grok-'));
    default:
      return [];
  }
}

export function getBestModelForFiles(
  provider: 'openai' | 'gemini' | 'anthropic' | 'grok', 
  files: File[], 
  currentModel?: string
): string {
  const providerModels = getProviderModels(provider);
  
  if (!files || files.length === 0) {
    return currentModel || providerModels[0];
  }
  
  const hasImages = files.some(file => file.type.startsWith('image/'));
  const hasPDFs = files.some(file => file.type === 'application/pdf');
  
  // Find the best model that supports the required capabilities
  for (const model of providerModels) {
    const capabilities = getModelCapabilities(model);
    
    if (hasImages && !capabilities.supportsVision) {
      continue;
    }
    
    if (hasPDFs && !capabilities.supportsPDF) {
      continue;
    }
    
    return model;
  }
  
  // Fallback to current model or first available
  return currentModel || providerModels[0];
}

export function canModelProcessFiles(model: string, files: File[]): { canProcess: boolean; reason?: string } {
  if (!files || files.length === 0) {
    return { canProcess: true };
  }
  
  const capabilities = getModelCapabilities(model);
  
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      if (!capabilities.supportsVision) {
        return { 
          canProcess: false, 
          reason: `El modelo ${model} no soporta análisis de imágenes` 
        };
      }
    }
    
    if (file.type === 'application/pdf') {
      if (!capabilities.supportsPDF) {
        return { 
          canProcess: false, 
          reason: `El modelo ${model} no soporta análisis de PDFs` 
        };
      }
    }
  }
  
  return { canProcess: true };
}
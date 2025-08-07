// Model capabilities configuration
export interface ModelCapabilities {
  supportsVision: boolean;
  supportsPDF: boolean;
  maxImageSize?: number; // in MB
  maxPDFSize?: number; // in MB
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

export function canProcessFile(model: string, fileType: string, fileSize: number): {
  canProcess: boolean;
  reason?: string;
} {
  const capabilities = getModelCapabilities(model);
  
  // Check if it's an image (either generic "image" type or specific format)
  const imageFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
  const isImage = fileType.toLowerCase() === 'image' || imageFormats.includes(fileType.toLowerCase());
  
  // Check if it's a PDF
  const isPDF = fileType.toLowerCase() === 'pdf';
  
  if (isImage) {
    if (!capabilities.supportsVision) {
      return { 
        canProcess: false, 
        reason: `El modelo ${model} no soporta análisis de imágenes` 
      };
    }
    
    if (capabilities.maxImageSize && fileSize > capabilities.maxImageSize * 1024 * 1024) {
      return { 
        canProcess: false, 
        reason: `La imagen excede el tamaño máximo de ${capabilities.maxImageSize}MB para ${model}` 
      };
    }
    
    if (capabilities.supportedImageFormats && 
        fileType.toLowerCase() !== 'image' &&
        !capabilities.supportedImageFormats.includes(fileType.toLowerCase())) {
      return { 
        canProcess: false, 
        reason: `El modelo ${model} no soporta el formato ${fileType}` 
      };
    }
    
    return { canProcess: true };
  }
  
  if (isPDF) {
    if (!capabilities.supportsPDF) {
      return { 
        canProcess: false, 
        reason: `El modelo ${model} no soporta análisis de PDFs` 
      };
    }
    
    if (capabilities.maxPDFSize && fileSize > capabilities.maxPDFSize * 1024 * 1024) {
      return { 
        canProcess: false, 
        reason: `El PDF excede el tamaño máximo de ${capabilities.maxPDFSize}MB para ${model}` 
      };
    }
    
    return { canProcess: true };
  }
  
  return { 
    canProcess: false, 
    reason: `Tipo de archivo ${fileType} no soportado` 
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

export function getBestModelForFiles(provider: 'openai' | 'gemini' | 'anthropic' | 'grok', files: Array<{ type: string }>, currentModel?: string): string {
  const providerModels = getProviderModels(provider);
  
  if (!files || files.length === 0) {
    return currentModel || providerModels[0];
  }
  
  const hasImages = files.some(file => file.type === 'image');
  const hasPDFs = files.some(file => file.type === 'pdf');
  
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
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
  
  // Check if it's an image
  const imageFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
  const isImage = imageFormats.includes(fileType.toLowerCase());
  
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
interface UploadedFile {
  id: string;
  name: string;
  type: 'image' | 'pdf';
  size: number;
  mimeType: string;
  preview?: string;
}

interface FileUploadResponse {
  success: boolean;
  data?: {
    files: UploadedFile[];
    errors?: Array<{ file: string; error: string }>;
  };
  error?: string;
}

interface FileDataResponse {
  success: boolean;
  data?: {
    id: string;
    name: string;
    type: 'image' | 'pdf';
    size: number;
    mimeType: string;
    base64?: string;
    text?: string;
  };
  error?: string;
}

interface ModelCapabilitiesResponse {
  success: boolean;
  data?: Record<string, Record<string, { canProcess: boolean; reason?: string }>>;
  error?: string;
}

class FileAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : '';
  }

  async uploadFiles(files: File[]): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`${this.baseURL}/api/upload/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: error.message || 'Error al subir los archivos'
      };
    }
  }

  async getFileData(fileId: string): Promise<FileDataResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/upload/file/${fileId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Get file data error:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener los datos del archivo'
      };
    }
  }

  async deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/upload/file/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Delete file error:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar el archivo'
      };
    }
  }

  async checkModelCapabilities(
    models: string[], 
    fileTypes: string[]
  ): Promise<ModelCapabilitiesResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/upload/check-capabilities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ models, fileTypes })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Check capabilities error:', error);
      return {
        success: false,
        error: error.message || 'Error al verificar las capacidades del modelo'
      };
    }
  }
}

export const fileAPI = new FileAPI();
export type { UploadedFile, FileUploadResponse, FileDataResponse };
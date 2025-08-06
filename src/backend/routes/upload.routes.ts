import { Router, Request, Response } from 'express';
import { upload, handleUploadError } from '../middleware/upload.middleware';
import { FileUploadService } from '../services/file-upload.service';
import { canProcessFile } from '../config/model-capabilities';

const router = Router();
const fileUploadService = FileUploadService.getInstance();

// Upload files endpoint
router.post('/upload', 
  upload.array('files', 5),
  handleUploadError,
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No se recibieron archivos'
        });
      }

      const processedFiles = [];
      const errors = [];

      for (const file of files) {
        try {
          const processed = await fileUploadService.processFile(file);
          processedFiles.push({
            id: processed.id,
            name: processed.originalName,
            type: processed.type,
            size: processed.size,
            mimeType: processed.mimeType,
            preview: processed.type === 'image' ? processed.base64?.substring(0, 100) + '...' : undefined
          });
        } catch (error: any) {
          errors.push({
            file: file.originalname,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        data: {
          files: processedFiles,
          errors: errors.length > 0 ? errors : undefined
        }
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al procesar los archivos'
      });
    }
  }
);

// Check model capabilities for files
router.post('/check-capabilities', async (req: Request, res: Response) => {
  try {
    const { models, fileTypes } = req.body;
    
    if (!models || !fileTypes) {
      return res.status(400).json({
        success: false,
        error: 'Faltan parámetros requeridos'
      });
    }

    const capabilities: any = {};
    
    for (const model of models) {
      capabilities[model] = {};
      for (const fileType of fileTypes) {
        // Assume average file size for checking
        const testSize = fileType === 'pdf' ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
        capabilities[model][fileType] = canProcessFile(model, fileType, testSize);
      }
    }

    res.json({
      success: true,
      data: capabilities
    });
  } catch (error: any) {
    console.error('Capabilities check error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al verificar capacidades'
    });
  }
});

// Get file data
router.get('/file/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const file = fileUploadService.getFile(fileId);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'Archivo no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        id: file.id,
        name: file.originalName,
        type: file.type,
        size: file.size,
        mimeType: file.mimeType,
        base64: file.base64,
        text: file.text
      }
    });
  } catch (error: any) {
    console.error('Get file error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener el archivo'
    });
  }
});

// Delete file
router.delete('/file/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    fileUploadService.deleteFile(fileId);
    
    res.json({
      success: true,
      message: 'Archivo eliminado correctamente'
    });
  } catch (error: any) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al eliminar el archivo'
    });
  }
});

export default router;
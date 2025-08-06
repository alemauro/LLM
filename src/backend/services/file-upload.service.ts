import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import pdfParse from 'pdf-parse';
import { fileTypeFromBuffer } from 'file-type';
import crypto from 'crypto';

export interface ProcessedFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  base64?: string;
  text?: string; // For PDF text extraction
  type: 'image' | 'pdf' | 'unknown';
}

export class FileUploadService {
  private uploadDir: string;
  private tempFiles: Map<string, ProcessedFile> = new Map();

  constructor() {
    // Use environment variable or default to local uploads directory
    this.uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    this.ensureUploadDirectory();
    
    // Cleanup old files every hour
    setInterval(() => this.cleanupOldFiles(), 3600000);
  }

  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async processFile(file: Express.Multer.File): Promise<ProcessedFile> {
    try {
      const fileBuffer = fs.readFileSync(file.path);
      const fileType = await fileTypeFromBuffer(fileBuffer);
      
      if (!fileType) {
        throw new Error('No se pudo determinar el tipo de archivo');
      }

      const fileId = crypto.randomBytes(16).toString('hex');
      const processedFile: ProcessedFile = {
        id: fileId,
        originalName: file.originalname,
        mimeType: fileType.mime,
        size: file.size,
        path: file.path,
        type: 'unknown'
      };

      // Process based on file type
      if (fileType.mime.startsWith('image/')) {
        processedFile.type = 'image';
        processedFile.base64 = await this.processImage(file.path, fileType.ext);
      } else if (fileType.mime === 'application/pdf') {
        processedFile.type = 'pdf';
        const pdfData = await this.processPDF(fileBuffer);
        processedFile.text = pdfData.text;
        // Also create a preview image if possible
        processedFile.base64 = await this.createPDFPreview(file.path);
      } else {
        throw new Error(`Tipo de archivo no soportado: ${fileType.mime}`);
      }

      // Store file info temporarily
      this.tempFiles.set(fileId, processedFile);
      
      // Schedule deletion after 10 minutes
      setTimeout(() => this.deleteFile(fileId), 600000);

      return processedFile;
    } catch (error) {
      // Clean up file on error
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  }

  private async processImage(filePath: string, format: string): Promise<string> {
    try {
      // Resize image if too large (max 2048px on longest side)
      const image = sharp(filePath);
      const metadata = await image.metadata();
      
      let processedImage = image;
      if (metadata.width && metadata.height) {
        const maxDimension = 2048;
        if (metadata.width > maxDimension || metadata.height > maxDimension) {
          processedImage = image.resize(maxDimension, maxDimension, {
            fit: 'inside',
            withoutEnlargement: true
          });
        }
      }

      // Convert to base64
      const buffer = await processedImage.toBuffer();
      const base64 = buffer.toString('base64');
      const mimeType = `image/${format}`;
      
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Error al procesar la imagen');
    }
  }

  private async processPDF(buffer: Buffer): Promise<{ text: string; pages: number }> {
    try {
      const data = await pdfParse(buffer);
      return {
        text: data.text,
        pages: data.numpages
      };
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw new Error('Error al procesar el PDF');
    }
  }

  private async createPDFPreview(filePath: string): Promise<string> {
    // For now, return a placeholder - in production you might use pdf2image
    return 'data:image/svg+xml;base64,' + Buffer.from(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#f3f4f6"/>
        <text x="50" y="50" font-family="Arial" font-size="14" fill="#6b7280" text-anchor="middle" dominant-baseline="middle">PDF</text>
      </svg>
    `).toString('base64');
  }

  getFile(fileId: string): ProcessedFile | undefined {
    return this.tempFiles.get(fileId);
  }

  deleteFile(fileId: string): void {
    const file = this.tempFiles.get(fileId);
    if (file) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      this.tempFiles.delete(fileId);
    }
  }

  private cleanupOldFiles(): void {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    for (const [fileId, file] of this.tempFiles) {
      const stats = fs.statSync(file.path);
      if (now - stats.mtimeMs > maxAge) {
        this.deleteFile(fileId);
      }
    }
  }

  cleanupAll(): void {
    for (const fileId of this.tempFiles.keys()) {
      this.deleteFile(fileId);
    }
  }
}
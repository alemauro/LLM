import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Content, Part } from '@google/generative-ai';
import { LLMRequest, LLMResponse } from '../types';
import { Response } from 'express';

export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ GEMINI_API_KEY no está configurada');
    }

    this.genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');
  }

  public async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    try {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
        return {
          success: false,
          error: 'API Key de Gemini no configurada. Por favor, configure GEMINI_API_KEY en el archivo .env'
        };
      }

      const model = request.model || 'gemini-2.0-flash-lite';
      const temperature = request.temperature ?? 0.7;

      const geminiModel = this.genAI.getGenerativeModel({
        model: model,
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: 2000,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });

      // Prepare content - handle images and text
      const parts: Part[] = [];
      
      // Add text content
      parts.push({ text: request.prompt });

      // Add images if present
      if (request.files && request.files.length > 0) {
        console.log(`🖼️ Gemini: Processing ${request.files.length} files for LLM`);
        
        for (const file of request.files) {
          console.log(`📁 Gemini: Processing file ${file.name} (${file.type})`);
          
          if (file.type === 'image' && file.base64) {
            // Extract base64 data from data URL
            const base64Match = file.base64.match(/data:([^;]+);base64,(.+)/);
            if (base64Match) {
              const mimeType = base64Match[1];
              const base64Data = base64Match[2];
              
              console.log(`🖼️ Gemini: Adding image ${file.name} to message (${mimeType})`);
              console.log(`📊 Image base64 data length: ${base64Data.length}`);
              
              parts.push({
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              });
            } else {
              console.error(`❌ Gemini: Invalid base64 format for image ${file.name}`);
            }
          } else if (file.type === 'image' && !file.base64) {
            console.error(`❌ Gemini: Image file ${file.name} is missing base64 data`);
          } else if (file.type === 'pdf' && file.text) {
            console.log(`📄 Gemini: Adding PDF text ${file.name} to message`);
            console.log(`📊 PDF text length: ${file.text.length}`);
            // For PDFs, add the extracted text as additional context
            parts.push({
              text: `Contenido del PDF "${file.name}":\n\n${file.text}`
            });
          } else if (file.type === 'pdf' && !file.text) {
            console.error(`❌ Gemini: PDF file ${file.name} is missing text data`);
          }
        }
      }

      const result = await geminiModel.generateContent(parts);
      const response = result.response.text();

      const attachedFiles = request.files?.map(file => ({
        name: file.name,
        type: file.type
      }));

      console.log(`📎 Gemini: Returning ${attachedFiles?.length || 0} attached files:`, attachedFiles);

      return {
        success: true,
        data: {
          response,
          model,
          temperature,
          attachedFiles
        }
      };
    } catch (error) {
      console.error('Error en Gemini Service:', error);
      
      let errorMessage = 'Error al generar respuesta con Gemini';
      if (error instanceof Error) {
        if (error.message.includes('API_KEY_INVALID')) {
          errorMessage = 'API Key de Gemini inválida';
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
          errorMessage = 'Límite de uso de API excedido';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  public async generateStreamResponse(request: LLMRequest, res: Response): Promise<void> {
    try {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
        res.status(400).json({
          success: false,
          error: 'API Key de Gemini no configurada. Por favor, configure GEMINI_API_KEY en el archivo .env'
        });
        return;
      }

      const model = request.model || 'gemini-2.0-flash-lite';
      const temperature = request.temperature ?? 0.7;

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Send file information at the beginning if files are attached
      if (request.files && request.files.length > 0) {
        const fileInfo = {
          type: 'files_info',
          files: request.files.map(file => ({
            name: file.name,
            type: file.type
          }))
        };
        res.write(`data: ${JSON.stringify(fileInfo)}\n\n`);
        console.log(`📎 Gemini Stream: Sent file info for ${request.files.length} files`);
      }

      // Prepare content - handle images and text
      const parts: Part[] = [];
      
      // Add text content
      parts.push({ text: request.prompt });

      // Add images if present
      if (request.files && request.files.length > 0) {
        console.log(`🖼️ Gemini Stream: Processing ${request.files.length} files for LLM`);
        
        for (const file of request.files) {
          console.log(`📁 Gemini Stream: Processing file ${file.name} (${file.type})`);
          
          if (file.type === 'image' && file.base64) {
            // Extract base64 data from data URL
            const base64Match = file.base64.match(/data:([^;]+);base64,(.+)/);
            if (base64Match) {
              const mimeType = base64Match[1];
              const base64Data = base64Match[2];
              
              console.log(`🖼️ Gemini Stream: Adding image ${file.name} to message (${mimeType})`);
              console.log(`📊 Image base64 data length: ${base64Data.length}`);
              
              parts.push({
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              });
            } else {
              console.error(`❌ Gemini Stream: Invalid base64 format for image ${file.name}`);
            }
          } else if (file.type === 'image' && !file.base64) {
            console.error(`❌ Gemini Stream: Image file ${file.name} is missing base64 data`);
          } else if (file.type === 'pdf' && file.text) {
            console.log(`📄 Gemini Stream: Adding PDF text ${file.name} to message`);
            console.log(`📊 PDF text length: ${file.text.length}`);
            // For PDFs, add the extracted text
            parts.push({
              text: `Contenido del PDF "${file.name}":\n\n${file.text}`
            });
          } else if (file.type === 'pdf' && !file.text) {
            console.error(`❌ Gemini Stream: PDF file ${file.name} is missing text data`);
          }
        }
      }

      const geminiModel = this.genAI.getGenerativeModel({
        model: model,
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: 2000,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });

      const result = await geminiModel.generateContentStream(parts);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          res.write(`data: ${JSON.stringify({ content: chunkText, provider: 'gemini' })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true, provider: 'gemini' })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Error en Gemini Stream:', error);
      
      let errorMessage = 'Error al generar respuesta con Gemini';
      if (error instanceof Error) {
        if (error.message.includes('API_KEY_INVALID')) {
          errorMessage = 'API Key de Gemini inválida';
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
          errorMessage = 'Límite de uso de API excedido';
        } else {
          errorMessage = error.message;
        }
      }

      res.write(`data: ${JSON.stringify({ error: errorMessage, provider: 'gemini' })}\n\n`);
      res.end();
    }
  }

  public getAvailableModels(): string[] {
    return [
      'gemini-2.0-flash-lite',
      'gemini-2.0-flash'
    ];
  }
}
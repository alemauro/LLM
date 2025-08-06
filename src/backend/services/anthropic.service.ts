import Anthropic from '@anthropic-ai/sdk';
import { LLMRequest, LLMResponse } from '../types';
import { Response } from 'express';

export class AnthropicService {
  private anthropic: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ ANTHROPIC_API_KEY no está configurada');
    }

    this.anthropic = new Anthropic({
      apiKey: apiKey || 'dummy-key'
    });
  }

  public async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    try {
      if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-anthropic-api-key-here') {
        return {
          success: false,
          error: 'API Key de Anthropic no configurada. Por favor, configure ANTHROPIC_API_KEY en el archivo .env'
        };
      }

      const model = request.model || 'claude-3-5-haiku-latest';
      const temperature = request.temperature ?? 0.7;

      // Prepare message content - handle images and PDFs if present
      let messageContent: any = request.prompt;
      
      if (request.files && request.files.length > 0) {
        console.log(`🖼️ Anthropic: Processing ${request.files.length} files for LLM`);
        const contentArray: any[] = [];
        
        // Add text content
        contentArray.push({
          type: "text",
          text: request.prompt
        });

        // Add images and PDFs
        for (const file of request.files) {
          console.log(`📁 Anthropic: Processing file ${file.name} (${file.type})`);
          
          if (file.type === 'image' && file.base64) {
            // Extract media type and base64 data from data URL
            const mediaTypeMatch = file.base64.match(/data:([^;]+);base64,(.+)/);
            if (mediaTypeMatch) {
              const mediaType = mediaTypeMatch[1];
              const base64Data = mediaTypeMatch[2];
              
              console.log(`🖼️ Anthropic: Adding image ${file.name} to message (${mediaType})`);
              console.log(`📊 Image base64 data length: ${base64Data.length}`);
              console.log(`🔍 Extracted media_type for Anthropic: "${mediaType}"`);
              
              // Validate media type for Anthropic
              const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
              if (!validTypes.includes(mediaType)) {
                console.error(`❌ Anthropic: Invalid media_type "${mediaType}". Valid types: ${validTypes.join(', ')}`);
                continue;
              }
              
              contentArray.push({
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64Data
                }
              });
            } else {
              console.error(`❌ Anthropic: Invalid base64 format for image ${file.name}`);
            }
          } else if (file.type === 'image' && !file.base64) {
            console.error(`❌ Anthropic: Image file ${file.name} is missing base64 data`);
          } else if (file.type === 'pdf' && file.text) {
            console.log(`📄 Anthropic: Adding PDF text ${file.name} to message`);
            console.log(`📊 PDF text length: ${file.text.length}`);
            // For PDFs, add the extracted text
            contentArray.push({
              type: "text",
              text: `Contenido del PDF "${file.name}":\n\n${file.text}`
            });
          } else if (file.type === 'pdf' && !file.text) {
            console.error(`❌ Anthropic: PDF file ${file.name} is missing text data`);
          }
        }
        
        messageContent = contentArray;
      }

      const message = await this.anthropic.messages.create({
        model: model,
        messages: [
          {
            role: 'user',
            content: messageContent
          }
        ],
        temperature: temperature,
        max_tokens: 2000
      });

      const response = message.content
        .filter(block => block.type === 'text')
        .map(block => (block as any).text)
        .join('\n');

      return {
        success: true,
        data: {
          response,
          model,
          temperature,
          attachedFiles: request.files?.map(file => ({
            name: file.name,
            type: file.type
          }))
        }
      };
    } catch (error) {
      console.error('Error en Anthropic Service:', error);
      
      let errorMessage = 'Error al generar respuesta con Anthropic';
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = 'API Key de Anthropic inválida';
        } else if (error.message.includes('429')) {
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
      if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-anthropic-api-key-here') {
        res.status(400).json({
          success: false,
          error: 'API Key de Anthropic no configurada. Por favor, configure ANTHROPIC_API_KEY en el archivo .env'
        });
        return;
      }

      const model = request.model || 'claude-3-5-haiku-latest';
      const temperature = request.temperature ?? 0.7;

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Prepare message content - handle images and PDFs if present
      let messageContent: any = request.prompt;
      
      if (request.files && request.files.length > 0) {
        console.log(`🖼️ Anthropic Stream: Processing ${request.files.length} files for LLM`);
        const contentArray: any[] = [];
        
        // Add text content
        contentArray.push({
          type: "text",
          text: request.prompt
        });

        // Add images and PDFs
        for (const file of request.files) {
          console.log(`📁 Anthropic Stream: Processing file ${file.name} (${file.type})`);
          
          if (file.type === 'image' && file.base64) {
            // Extract media type and base64 data from data URL
            const mediaTypeMatch = file.base64.match(/data:([^;]+);base64,(.+)/);
            if (mediaTypeMatch) {
              const mediaType = mediaTypeMatch[1];
              const base64Data = mediaTypeMatch[2];
              
              console.log(`🖼️ Anthropic Stream: Adding image ${file.name} to message (${mediaType})`);
              console.log(`📊 Image base64 data length: ${base64Data.length}`);
              console.log(`🔍 Extracted media_type for Anthropic Stream: "${mediaType}"`);
              
              // Validate media type for Anthropic
              const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
              if (!validTypes.includes(mediaType)) {
                console.error(`❌ Anthropic Stream: Invalid media_type "${mediaType}". Valid types: ${validTypes.join(', ')}`);
                continue;
              }
              
              contentArray.push({
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64Data
                }
              });
            } else {
              console.error(`❌ Anthropic Stream: Invalid base64 format for image ${file.name}`);
            }
          } else if (file.type === 'image' && !file.base64) {
            console.error(`❌ Anthropic Stream: Image file ${file.name} is missing base64 data`);
          } else if (file.type === 'pdf' && file.text) {
            console.log(`📄 Anthropic Stream: Adding PDF text ${file.name} to message`);
            console.log(`📊 PDF text length: ${file.text.length}`);
            // For PDFs, add the extracted text
            contentArray.push({
              type: "text",
              text: `Contenido del PDF "${file.name}":\n\n${file.text}`
            });
          } else if (file.type === 'pdf' && !file.text) {
            console.error(`❌ Anthropic Stream: PDF file ${file.name} is missing text data`);
          }
        }
        
        messageContent = contentArray;
      }

      const stream = await this.anthropic.messages.create({
        model: model,
        messages: [
          {
            role: 'user',
            content: messageContent
          }
        ],
        temperature: temperature,
        max_tokens: 2000,
        stream: true
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const content = chunk.delta.text;
          if (content) {
            res.write(`data: ${JSON.stringify({ content, provider: 'anthropic' })}\n\n`);
          }
        }
      }

      res.write(`data: ${JSON.stringify({ done: true, provider: 'anthropic', model, temperature })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Error en Anthropic Stream:', error);
      
      let errorMessage = 'Error al generar respuesta con Anthropic';
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = 'API Key de Anthropic inválida';
        } else if (error.message.includes('429')) {
          errorMessage = 'Límite de uso de API excedido';
        } else {
          errorMessage = error.message;
        }
      }

      res.write(`data: ${JSON.stringify({ error: errorMessage, provider: 'anthropic' })}\n\n`);
      res.end();
    }
  }

  public getAvailableModels(): string[] {
    return [
      'claude-3-5-haiku-latest',
      'claude-3-5-sonnet-20240620'
    ];
  }
}
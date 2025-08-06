import OpenAI from 'openai';
import { LLMRequest, LLMResponse } from '../types';
import { Response } from 'express';

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ OPENAI_API_KEY no está configurada');
    }

    this.openai = new OpenAI({
      apiKey: apiKey || 'dummy-key'
    });
  }

  public async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    try {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
        return {
          success: false,
          error: 'API Key de OpenAI no configurada. Por favor, configure OPENAI_API_KEY en el archivo .env'
        };
      }

      const model = request.model || 'gpt-4o-mini-2024-07-18';
      const temperature = request.temperature ?? 0.7;

      // Prepare message content - handle images if present
      let messageContent: any = request.prompt;
      
      if (request.files && request.files.length > 0) {
        console.log(`🖼️ OpenAI: Processing ${request.files.length} files for LLM`);
        messageContent = [
          {
            type: "text",
            text: request.prompt
          }
        ];

        // Add images to the message
        for (const file of request.files) {
          console.log(`📁 OpenAI: Processing file ${file.name} (${file.type})`);
          
          if (file.type === 'image' && file.base64) {
            console.log(`🖼️ OpenAI: Adding image ${file.name} to message`);
            console.log(`📊 Image base64 length: ${file.base64.length}`);
            
            messageContent.push({
              type: "image_url",
              image_url: {
                url: file.base64,
                detail: "high"
              }
            });
          } else if (file.type === 'image' && !file.base64) {
            console.error(`❌ OpenAI: Image file ${file.name} is missing base64 data`);
          }
        }
      }

      const completion = await this.openai.chat.completions.create({
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

      const response = completion.choices[0]?.message?.content || '';

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
      console.error('Error en OpenAI Service:', error);
      
      let errorMessage = 'Error al generar respuesta con OpenAI';
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = 'API Key de OpenAI inválida';
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
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
        res.status(400).json({
          success: false,
          error: 'API Key de OpenAI no configurada. Por favor, configure OPENAI_API_KEY en el archivo .env'
        });
        return;
      }

      const model = request.model || 'gpt-4o-mini-2024-07-18';
      const temperature = request.temperature ?? 0.7;

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Prepare message content - handle images if present
      let messageContent: any = request.prompt;
      
      if (request.files && request.files.length > 0) {
        console.log(`🖼️ OpenAI Stream: Processing ${request.files.length} files for LLM`);
        messageContent = [
          {
            type: "text",
            text: request.prompt
          }
        ];

        // Add images to the message
        for (const file of request.files) {
          console.log(`📁 OpenAI Stream: Processing file ${file.name} (${file.type})`);
          
          if (file.type === 'image' && file.base64) {
            console.log(`🖼️ OpenAI Stream: Adding image ${file.name} to message`);
            console.log(`📊 Image base64 length: ${file.base64.length}`);
            
            messageContent.push({
              type: "image_url",
              image_url: {
                url: file.base64,
                detail: "high"
              }
            });
          } else if (file.type === 'image' && !file.base64) {
            console.error(`❌ OpenAI Stream: Image file ${file.name} is missing base64 data`);
          }
        }
      }

      const stream = await this.openai.chat.completions.create({
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
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          res.write(`data: ${JSON.stringify({ content, provider: 'openai' })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true, provider: 'openai', model, temperature })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Error en OpenAI Stream:', error);
      
      let errorMessage = 'Error al generar respuesta con OpenAI';
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = 'API Key de OpenAI inválida';
        } else if (error.message.includes('429')) {
          errorMessage = 'Límite de uso de API excedido';
        } else {
          errorMessage = error.message;
        }
      }

      res.write(`data: ${JSON.stringify({ error: errorMessage, provider: 'openai' })}\n\n`);
      res.end();
    }
  }

  public getAvailableModels(): string[] {
    return [
      'gpt-4o-mini-2024-07-18',
      'gpt-3.5-turbo-0125'
    ];
  }
}
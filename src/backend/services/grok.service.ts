import { LLMRequest, LLMResponse } from '../types';
import { Response } from 'express';

export class GrokService {
  private apiKey: string;
  private baseURL: string = 'https://api.x.ai/v1';

  constructor() {
    const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ GROK_API_KEY no está configurada');
    }

    this.apiKey = apiKey || 'dummy-key';
  }

  public async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    try {
      const grokApiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
      if (!grokApiKey || grokApiKey === 'your-xai-api-key-here') {
        return {
          success: false,
          error: 'API Key de xAI no configurada. Por favor, configure GROK_API_KEY en el archivo .env'
        };
      }

      const model = request.model || 'grok-3-mini-fast';
      const temperature = request.temperature ?? 0.7;

      // Prepare message content - handle images if present
      let messageContent: any = request.prompt;
      
      if (request.files && request.files.length > 0) {
        console.log(`🖼️ Grok: Processing ${request.files.length} files for LLM`);
        messageContent = [
          {
            type: "text",
            text: request.prompt
          }
        ];

        // Add images to the message (only for vision models)
        for (const file of request.files) {
          console.log(`📁 Grok: Processing file ${file.name} (${file.type})`);
          
          if (file.type === 'image' && file.base64 && model.includes('vision')) {
            console.log(`🖼️ Grok: Adding image ${file.name} to message`);
            console.log(`📊 Image base64 length: ${file.base64.length}`);
            
            messageContent.push({
              type: "image_url",
              image_url: {
                url: file.base64
              }
            });
          } else if (file.type === 'image' && !file.base64) {
            console.error(`❌ Grok: Image file ${file.name} is missing base64 data`);
          } else if (file.type === 'pdf' && file.text) {
            console.log(`📄 Grok: Adding PDF text ${file.name} to message`);
            console.log(`📊 PDF text length: ${file.text.length}`);
            // For PDFs, add the extracted text
            messageContent.push({
              type: "text",
              text: `Contenido del PDF "${file.name}":\n\n${file.text}`
            });
          } else if (file.type === 'pdf' && !file.text) {
            console.error(`❌ Grok: PDF file ${file.name} is missing text data`);
          } else if (file.type === 'image' && !model.includes('vision')) {
            console.error(`❌ Grok: Model ${model} does not support image analysis`);
          }
        }
      }

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: messageContent
            }
          ],
          temperature: temperature,
          max_tokens: 2000,
          stream: false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.choices[0]?.message?.content || '';

      const attachedFiles = request.files?.map(file => ({
        name: file.name,
        type: file.type
      }));

      console.log(`📎 Grok: Returning ${attachedFiles?.length || 0} attached files:`, attachedFiles);

      return {
        success: true,
        data: {
          response: responseText,
          model,
          temperature,
          attachedFiles
        }
      };
    } catch (error) {
      console.error('Error en Grok Service:', error);
      
      let errorMessage = 'Error al generar respuesta con Grok';
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = 'API Key de xAI inválida';
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
      const grokApiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
      if (!grokApiKey || grokApiKey === 'your-xai-api-key-here') {
        res.status(400).json({
          success: false,
          error: 'API Key de xAI no configurada. Por favor, configure GROK_API_KEY en el archivo .env'
        });
        return;
      }

      const model = request.model || 'grok-3-mini-fast';
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
        console.log(`📎 Grok Stream: Sent file info for ${request.files.length} files`);
      }

      // Prepare message content - handle images if present
      let messageContent: any = request.prompt;
      
      if (request.files && request.files.length > 0) {
        console.log(`🖼️ Grok Stream: Processing ${request.files.length} files for LLM`);
        messageContent = [
          {
            type: "text",
            text: request.prompt
          }
        ];

        // Add images to the message (only for vision models)
        for (const file of request.files) {
          console.log(`📁 Grok Stream: Processing file ${file.name} (${file.type})`);
          
          if (file.type === 'image' && file.base64 && model.includes('vision')) {
            console.log(`🖼️ Grok Stream: Adding image ${file.name} to message`);
            console.log(`📊 Image base64 length: ${file.base64.length}`);
            
            messageContent.push({
              type: "image_url",
              image_url: {
                url: file.base64
              }
            });
          } else if (file.type === 'image' && !file.base64) {
            console.error(`❌ Grok Stream: Image file ${file.name} is missing base64 data`);
          } else if (file.type === 'pdf' && file.text) {
            console.log(`📄 Grok Stream: Adding PDF text ${file.name} to message`);
            console.log(`📊 PDF text length: ${file.text.length}`);
            // For PDFs, add the extracted text
            messageContent.push({
              type: "text",
              text: `Contenido del PDF "${file.name}":\n\n${file.text}`
            });
          } else if (file.type === 'pdf' && !file.text) {
            console.error(`❌ Grok Stream: PDF file ${file.name} is missing text data`);
          } else if (file.type === 'image' && !model.includes('vision')) {
            console.error(`❌ Grok Stream: Model ${model} does not support image analysis`);
          }
        }
      }

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data.trim() === '[DONE]') {
                res.write(`data: ${JSON.stringify({ done: true, provider: 'grok' })}\n\n`);
                break;
              }
              
              if (data.trim()) {
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices[0]?.delta?.content;
                  if (content) {
                    res.write(`data: ${JSON.stringify({ content, provider: 'grok' })}\n\n`);
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      res.end();
    } catch (error) {
      console.error('Error en Grok Stream:', error);
      
      let errorMessage = 'Error al generar respuesta con Grok';
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = 'API Key de xAI inválida';
        } else if (error.message.includes('429')) {
          errorMessage = 'Límite de uso de API excedido';
        } else {
          errorMessage = error.message;
        }
      }

      res.write(`data: ${JSON.stringify({ error: errorMessage, provider: 'grok' })}\n\n`);
      res.end();
    }
  }

  public getAvailableModels(): string[] {
    return [
      'grok-3-mini-fast',
      'grok-2-vision-1212'
    ];
  }
}
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

      const message = await this.anthropic.messages.create({
        model: model,
        messages: [
          {
            role: 'user',
            content: request.prompt
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
          temperature
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

      const stream = await this.anthropic.messages.create({
        model: model,
        messages: [
          {
            role: 'user',
            content: request.prompt
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
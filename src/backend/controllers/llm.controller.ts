import { Request, Response } from 'express';
import { OpenAIService } from '../services/openai.service';
import { AnthropicService } from '../services/anthropic.service';
import { StatisticsService } from '../services/statistics.service';
import { StreamHelper } from '../services/stream-helper';
import { DualLLMRequest, DualLLMResponse } from '../types';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export class LLMController {
  private openaiService: OpenAIService;
  private anthropicService: AnthropicService;
  private statisticsService: StatisticsService;

  constructor() {
    this.openaiService = new OpenAIService();
    this.anthropicService = new AnthropicService();
    this.statisticsService = StatisticsService.getInstance();

    this.generateDualResponse = this.generateDualResponse.bind(this);
    this.getModels = this.getModels.bind(this);
    this.streamResponse = this.streamResponse.bind(this);
  }

  public async generateDualResponse(req: Request, res: Response): Promise<void> {
    try {
      const request = req.body as DualLLMRequest;

      if (!request.prompt) {
        res.status(400).json({
          success: false,
          error: 'El prompt es requerido'
        });
        return;
      }

      // Ejecutar ambas llamadas en paralelo
      const [openaiResponse, anthropicResponse] = await Promise.all([
        this.openaiService.generateResponse({
          prompt: request.prompt,
          model: request.openaiModel,
          temperature: request.openaiTemperature
        }),
        this.anthropicService.generateResponse({
          prompt: request.prompt,
          model: request.anthropicModel,
          temperature: request.anthropicTemperature
        })
      ]);

      // Incrementar estadísticas
      this.statisticsService.incrementPromptCount();

      const response: DualLLMResponse = {
        success: true,
        data: {
          openai: openaiResponse.success && openaiResponse.data ? {
            response: openaiResponse.data.response,
            model: openaiResponse.data.model,
            temperature: openaiResponse.data.temperature
          } : {
            response: openaiResponse.error || 'Error desconocido',
            model: request.openaiModel || 'gpt-4o-mini-2024-07-18',
            temperature: request.openaiTemperature || 0.7
          },
          anthropic: anthropicResponse.success && anthropicResponse.data ? {
            response: anthropicResponse.data.response,
            model: anthropicResponse.data.model,
            temperature: anthropicResponse.data.temperature
          } : {
            response: anthropicResponse.error || 'Error desconocido',
            model: request.anthropicModel || 'claude-3-5-haiku-latest',
            temperature: request.anthropicTemperature || 0.7
          }
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error in generateDualResponse:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  public async streamResponse(req: Request, res: Response): Promise<void> {
    try {
      const { prompt, provider, model, temperature, openaiModel, anthropicModel, openaiTemperature, anthropicTemperature } = req.body;

      if (!prompt) {
        res.status(400).json({
          success: false,
          error: 'El prompt es requerido'
        });
        return;
      }

      if (!provider || !['openai', 'anthropic', 'dual'].includes(provider)) {
        res.status(400).json({
          success: false,
          error: 'Provider debe ser: openai, anthropic o dual'
        });
        return;
      }

      // Incrementar estadísticas
      this.statisticsService.incrementPromptCount();

      if (provider === 'openai') {
        await this.openaiService.generateStreamResponse({ prompt, model, temperature }, res);
      } else if (provider === 'anthropic') {
        await this.anthropicService.generateStreamResponse({ prompt, model, temperature }, res);
      } else if (provider === 'dual') {
        // Usar el helper para manejar dual streaming real
        const openaiClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY || 'dummy-key'
        });
        
        const anthropicClient = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY || 'dummy-key'
        });

        await StreamHelper.handleDualStream(
          openaiClient,
          anthropicClient,
          {
            prompt,
            openaiModel: openaiModel || 'gpt-4o-mini-2024-07-18',
            anthropicModel: anthropicModel || 'claude-3-5-haiku-latest',
            openaiTemperature: openaiTemperature || temperature || 0.7,
            anthropicTemperature: anthropicTemperature || temperature || 0.7
          },
          res
        );
      }
    } catch (error) {
      console.error('Error in streamResponse:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Error interno del servidor'
        });
      }
    }
  }

  public getModels(_req: Request, res: Response): void {
    res.json({
      success: true,
      data: {
        openai: this.openaiService.getAvailableModels(),
        anthropic: this.anthropicService.getAvailableModels()
      }
    });
  }
}
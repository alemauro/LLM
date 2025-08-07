import { Request, Response } from 'express';
import { OpenAIService } from '../services/openai.service';
import { AnthropicService } from '../services/anthropic.service';
import { GeminiService } from '../services/gemini.service';
import { GrokService } from '../services/grok.service';
import { StatisticsService } from '../services/statistics.service';
import { StreamHelper } from '../services/stream-helper';
import { DualLLMRequest, DualLLMResponse, FileAttachment } from '../types';
import { FileUploadService } from '../services/file-upload.service';
import { canProcessFile, getBestModelForFiles } from '../config/model-capabilities';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export class LLMController {
  private openaiService: OpenAIService;
  private anthropicService: AnthropicService;
  private geminiService: GeminiService;
  private grokService: GrokService;
  private statisticsService: StatisticsService;
  private fileUploadService: FileUploadService;

  constructor() {
    this.openaiService = new OpenAIService();
    this.anthropicService = new AnthropicService();
    this.geminiService = new GeminiService();
    this.grokService = new GrokService();
    this.statisticsService = StatisticsService.getInstance();
    this.fileUploadService = FileUploadService.getInstance();

    this.generateDualResponse = this.generateDualResponse.bind(this);
    this.getModels = this.getModels.bind(this);
    this.streamResponse = this.streamResponse.bind(this);
  }

  private async processFiles(fileIds: string[]): Promise<FileAttachment[]> {
    const files: FileAttachment[] = [];
    
    console.log(`🔍 Processing ${fileIds.length} file IDs:`, fileIds);
    
    for (const fileId of fileIds) {
      try {
        console.log(`📁 Retrieving file with ID: ${fileId}`);
        const fileData = this.fileUploadService.getFile(fileId);
        console.log(`📄 File data:`, fileData ? {
          id: fileData.id,
          name: fileData.originalName,
          type: fileData.type,
          hasBase64: !!fileData.base64,
          base64Length: fileData.base64?.length,
          hasText: !!fileData.text
        } : null);
        
        if (!fileData) {
          console.error(`❌ File with ID ${fileId} not found in temporary storage`);
          continue;
        }
        
        if (fileData.type !== 'image' && fileData.type !== 'pdf') {
          console.error(`❌ File ${fileData.originalName} has unsupported type: ${fileData.type}`);
          continue;
        }

        // Validate file data integrity
        if (fileData.type === 'image' && !fileData.base64) {
          console.error(`❌ Image file ${fileData.originalName} missing base64 data`);
          continue;
        }

        if (fileData.type === 'pdf' && !fileData.text && !fileData.base64) {
          console.error(`❌ PDF file ${fileData.originalName} missing both text and base64 data`);
          continue;
        }

        files.push({
          id: fileData.id,
          name: fileData.originalName,
          type: fileData.type,
          base64: fileData.base64,
          text: fileData.text
        });
        console.log(`✅ Added file to processing list: ${fileData.originalName} (${fileData.type})`);
      } catch (error) {
        console.error(`Error processing file ${fileId}:`, error);
      }
    }
    
    console.log(`📋 Total files processed for LLM: ${files.length}`);
    return files;
  }

  private checkModelFileSupport(model: string, files: FileAttachment[]): { 
    canProcess: boolean; 
    warnings: string[] 
  } {
    const warnings: string[] = [];
    let canProcess = true;

    for (const file of files) {
      const capability = canProcessFile(model, file.type, 0); // Size already validated during upload
      if (!capability.canProcess) {
        warnings.push(`${model}: ${capability.reason}`);
        canProcess = false;
      }
    }

    return { canProcess, warnings };
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

      // Process uploaded files if any
      let files: FileAttachment[] = [];
      if (request.fileIds && request.fileIds.length > 0) {
        console.log(`🔍 Processing ${request.fileIds.length} files:`, request.fileIds);
        files = await this.processFiles(request.fileIds);
        console.log(`📁 Processed ${files.length} files successfully`);
      }

      // Determine active models and providers
      const firstProvider = request.firstProvider || 'openai';
      const secondProvider = request.secondProvider || 'anthropic';
      
      // Get the requested models
      const requestedFirstModel = firstProvider === 'openai' ? 
        (request.openaiModel || 'gpt-4o-mini-2024-07-18') : 
        (request.geminiModel || 'gemini-2.0-flash-lite');
        
      const requestedSecondModel = secondProvider === 'anthropic' ? 
        (request.anthropicModel || 'claude-3-5-haiku-latest') : 
        (request.grokModel || 'grok-3-mini-fast');
      
      // Auto-select best models for files if needed
      const firstModel = getBestModelForFiles(firstProvider, files, requestedFirstModel);
      const secondModel = getBestModelForFiles(secondProvider, files, requestedSecondModel);
      
      // Log model selection if it changed
      if (firstModel !== requestedFirstModel) {
        console.log(`🔄 Auto-selected ${firstModel} instead of ${requestedFirstModel} for ${firstProvider} due to file requirements`);
      }
      if (secondModel !== requestedSecondModel) {
        console.log(`🔄 Auto-selected ${secondModel} instead of ${requestedSecondModel} for ${secondProvider} due to file requirements`);
      }

      // Check file compatibility with models
      const firstModelSupport = files.length > 0 ? 
        this.checkModelFileSupport(firstModel, files) : 
        { canProcess: true, warnings: [] };
      
      const secondModelSupport = files.length > 0 ? 
        this.checkModelFileSupport(secondModel, files) : 
        { canProcess: true, warnings: [] };

      console.log(`🤖 First provider (${firstProvider}) model support:`, firstModelSupport);
      console.log(`🤖 Second provider (${secondProvider}) model support:`, secondModelSupport);

      // Execute both calls in parallel based on selected providers
      const firstService = firstProvider === 'openai' ? this.openaiService : this.geminiService;
      const secondService = secondProvider === 'anthropic' ? this.anthropicService : this.grokService;
      
      const firstTemperature = firstProvider === 'openai' ? 
        (request.openaiTemperature || 0.7) : 
        (request.geminiTemperature || 0.7);
        
      const secondTemperature = secondProvider === 'anthropic' ? 
        (request.anthropicTemperature || 0.7) : 
        (request.grokTemperature || 0.7);

      const [firstResponse, secondResponse] = await Promise.all([
        firstService.generateResponse({
          prompt: request.prompt,
          model: firstModel,
          temperature: firstTemperature,
          files: firstModelSupport.canProcess ? files : undefined
        }),
        secondService.generateResponse({
          prompt: request.prompt,
          model: secondModel,
          temperature: secondTemperature,
          files: secondModelSupport.canProcess ? files : undefined
        })
      ]);

      // Incrementar estadísticas
      this.statisticsService.incrementPromptCount();

      console.log(`🔍 Controller: First provider (${firstProvider}) attachedFiles:`, firstResponse.data?.attachedFiles);
      console.log(`🔍 Controller: Second provider (${secondProvider}) attachedFiles:`, secondResponse.data?.attachedFiles);

      const response: DualLLMResponse = {
        success: true,
        data: {
          first: firstResponse.success && firstResponse.data ? {
            provider: firstProvider,
            response: firstResponse.data.response,
            model: firstResponse.data.model,
            temperature: firstResponse.data.temperature,
            filesProcessed: firstModelSupport.canProcess && files.length > 0,
            fileWarnings: firstModelSupport.warnings.length > 0 ? firstModelSupport.warnings : undefined,
            attachedFiles: firstResponse.data.attachedFiles
          } : {
            provider: firstProvider,
            response: firstResponse.error || 'Error desconocido',
            model: firstModel,
            temperature: firstTemperature,
            fileWarnings: firstModelSupport.warnings.length > 0 ? firstModelSupport.warnings : undefined,
            attachedFiles: files.length > 0 ? files.map(file => ({ name: file.name, type: file.type })) : undefined
          },
          second: secondResponse.success && secondResponse.data ? {
            provider: secondProvider,
            response: secondResponse.data.response,
            model: secondResponse.data.model,
            temperature: secondResponse.data.temperature,
            filesProcessed: secondModelSupport.canProcess && files.length > 0,
            fileWarnings: secondModelSupport.warnings.length > 0 ? secondModelSupport.warnings : undefined,
            attachedFiles: secondResponse.data.attachedFiles
          } : {
            provider: secondProvider,
            response: secondResponse.error || 'Error desconocido',
            model: secondModel,
            temperature: secondTemperature,
            fileWarnings: secondModelSupport.warnings.length > 0 ? secondModelSupport.warnings : undefined,
            attachedFiles: files.length > 0 ? files.map(file => ({ name: file.name, type: file.type })) : undefined
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
      const { 
        prompt, 
        provider, 
        model, 
        temperature, 
        firstProvider, 
        secondProvider,
        openaiModel, 
        geminiModel,
        anthropicModel, 
        grokModel,
        openaiTemperature, 
        geminiTemperature,
        anthropicTemperature, 
        grokTemperature,
        fileIds 
      } = req.body;

      if (!prompt) {
        res.status(400).json({
          success: false,
          error: 'El prompt es requerido'
        });
        return;
      }

      if (!provider || !['openai', 'anthropic', 'gemini', 'grok', 'dual'].includes(provider)) {
        res.status(400).json({
          success: false,
          error: 'Provider debe ser: openai, anthropic, gemini, grok o dual'
        });
        return;
      }

      // Process uploaded files if any
      let files: FileAttachment[] = [];
      if (fileIds && fileIds.length > 0) {
        console.log(`🔍 Processing ${fileIds.length} files for streaming:`, fileIds);
        files = await this.processFiles(fileIds);
        console.log(`📁 Processed ${files.length} files successfully for streaming`);
      }

      // Incrementar estadísticas
      this.statisticsService.incrementPromptCount();

      // Auto-select best model for files if individual provider streaming
      let actualModel = model;
      if (['openai', 'anthropic', 'gemini', 'grok'].includes(provider)) {
        const bestModel = getBestModelForFiles(provider as any, files, model);
        if (bestModel !== model) {
          console.log(`🔄 Auto-selected ${bestModel} instead of ${model} for ${provider} streaming due to file requirements`);
          actualModel = bestModel;
        }
      }

      if (provider === 'openai') {
        await this.openaiService.generateStreamResponse({ prompt, model: actualModel, temperature, files }, res);
      } else if (provider === 'anthropic') {
        await this.anthropicService.generateStreamResponse({ prompt, model: actualModel, temperature, files }, res);
      } else if (provider === 'gemini') {
        await this.geminiService.generateStreamResponse({ prompt, model: actualModel, temperature, files }, res);
      } else if (provider === 'grok') {
        await this.grokService.generateStreamResponse({ prompt, model: actualModel, temperature, files }, res);
      } else if (provider === 'dual') {
        // Determine providers for dual mode
        const actualFirstProvider = firstProvider || 'openai';
        const actualSecondProvider = secondProvider || 'anthropic';
        
        // For now, only support OpenAI + Anthropic dual streaming
        // TODO: Expand StreamHelper to support all provider combinations
        if (actualFirstProvider === 'openai' && actualSecondProvider === 'anthropic') {
          await StreamHelper.handleDualStream(
            this.openaiService,
            this.anthropicService,
            {
              prompt,
              openaiModel: openaiModel || 'gpt-4o-mini-2024-07-18',
              anthropicModel: anthropicModel || 'claude-3-5-haiku-latest',
              openaiTemperature: openaiTemperature || temperature || 0.7,
              anthropicTemperature: anthropicTemperature || temperature || 0.7,
              files: files.length > 0 ? files : undefined
            },
            res
          );
        } else {
          // Fall back to non-streaming for unsupported provider combinations
          res.status(400).json({
            success: false,
            error: `Streaming dual mode not yet supported for ${actualFirstProvider} + ${actualSecondProvider}. Please use non-streaming mode.`
          });
        }
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
        // First box providers
        openai: this.openaiService.getAvailableModels(),
        gemini: this.geminiService.getAvailableModels(),
        // Second box providers
        anthropic: this.anthropicService.getAvailableModels(),
        grok: this.grokService.getAvailableModels()
      }
    });
  }
}
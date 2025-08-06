import { Response } from 'express';
import { OpenAIService } from './openai.service';
import { AnthropicService } from './anthropic.service';
import { FileAttachment } from '../types';
import { canProcessFile } from '../config/model-capabilities';

interface StreamConfig {
  prompt: string;
  openaiModel: string;
  anthropicModel: string;
  openaiTemperature: number;
  anthropicTemperature: number;
  files?: FileAttachment[];
}

export class StreamHelper {
  static async handleDualStream(
    openaiService: OpenAIService,
    anthropicService: AnthropicService,
    config: StreamConfig,
    res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send file information at the beginning if files are attached
    if (config.files && config.files.length > 0) {
      const fileInfo = {
        type: 'files_info',
        files: config.files.map(file => ({
          name: file.name,
          type: file.type
        }))
      };
      res.write(`data: ${JSON.stringify(fileInfo)}\n\n`);
    }

    let openaiComplete = false;
    let anthropicComplete = false;

    // OpenAI Stream
    const openaiPromise = (async () => {
      try {
        // Check file compatibility first
        let filesToUse: FileAttachment[] | undefined = undefined;
        if (config.files && config.files.length > 0) {
          console.log(`🔍 StreamHelper OpenAI: checking ${config.files.length} files for model ${config.openaiModel}`);
          config.files.forEach(file => {
            console.log(`📄 File details - ID: ${file.id}, Name: ${file.name}, Type: ${file.type}, HasBase64: ${!!file.base64}`);
          });
          
          const allSupported = config.files.every(file => {
            const capability = canProcessFile(config.openaiModel, file.type, 0);
            console.log(`📋 File ${file.name} (${file.type}): ${capability.canProcess ? 'supported' : capability.reason}`);
            return capability.canProcess;
          });
          
          if (allSupported) {
            filesToUse = config.files;
            console.log(`✅ StreamHelper OpenAI: will use ${filesToUse.length} files`);
          } else {
            console.log(`❌ StreamHelper OpenAI: won't use files due to compatibility issues`);
          }
        }
        
        // Use service's internal client for consistency with file handling
        const openai = openaiService['openai']; // Access the internal client
        
        // Prepare message content - handle images if present
        let messageContent: any = config.prompt;
        
        if (filesToUse && filesToUse.length > 0) {
          messageContent = [
            {
              type: "text",
              text: config.prompt
            }
          ];

          // Add images to the message
          for (const file of filesToUse) {
            if (file.type === 'image' && file.base64) {
              messageContent.push({
                type: "image_url",
                image_url: {
                  url: file.base64,
                  detail: "high"
                }
              });
            }
          }
        }

        const stream = await openai.chat.completions.create({
          model: config.openaiModel,
          messages: [{ role: 'user', content: messageContent }],
          temperature: config.openaiTemperature,
          max_tokens: 2000,
          stream: true
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            res.write(`data: ${JSON.stringify({ openai: content })}\n\n`);
          }
        }
        
        openaiComplete = true;
        if (anthropicComplete) {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
        }
      } catch (error) {
        console.error('OpenAI stream error:', error);
        res.write(`data: ${JSON.stringify({ openaiError: 'Error en OpenAI' })}\n\n`);
        openaiComplete = true;
        if (anthropicComplete) {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
        }
      }
    })();

    // Anthropic Stream
    const anthropicPromise = (async () => {
      try {
        // Check file compatibility first
        let filesToUse: FileAttachment[] | undefined = undefined;
        if (config.files && config.files.length > 0) {
          console.log(`🔍 StreamHelper Anthropic: checking ${config.files.length} files for model ${config.anthropicModel}`);
          config.files.forEach(file => {
            console.log(`📄 File details - ID: ${file.id}, Name: ${file.name}, Type: ${file.type}, HasBase64: ${!!file.base64}, HasText: ${!!file.text}`);
          });
          
          const allSupported = config.files.every(file => {
            const capability = canProcessFile(config.anthropicModel, file.type, 0);
            console.log(`📋 File ${file.name} (${file.type}): ${capability.canProcess ? 'supported' : capability.reason}`);
            return capability.canProcess;
          });
          
          if (allSupported) {
            filesToUse = config.files;
            console.log(`✅ StreamHelper Anthropic: will use ${filesToUse.length} files`);
          } else {
            console.log(`❌ StreamHelper Anthropic: won't use files due to compatibility issues`);
          }
        }
        
        // Use service's internal client for consistency with file handling
        const anthropic = anthropicService['anthropic']; // Access the internal client
        
        // Prepare message content - handle images and PDFs if present
        let messageContent: any = config.prompt;
        
        if (filesToUse && filesToUse.length > 0) {
          const contentArray: any[] = [];
          
          // Add text content
          contentArray.push({
            type: "text",
            text: config.prompt
          });

          // Add images and PDFs
          for (const file of filesToUse) {
            if (file.type === 'image' && file.base64) {
              // Extract media type and base64 data from data URL
              const mediaTypeMatch = file.base64.match(/data:([^;]+);base64,(.+)/);
              if (mediaTypeMatch) {
                const mediaType = mediaTypeMatch[1];
                const base64Data = mediaTypeMatch[2];
                
                contentArray.push({
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mediaType,
                    data: base64Data
                  }
                });
              }
            } else if (file.type === 'pdf' && file.text) {
              // For PDFs, add the extracted text
              contentArray.push({
                type: "text",
                text: `Contenido del PDF "${file.name}":\n\n${file.text}`
              });
            }
          }
          
          messageContent = contentArray;
        }

        const stream = await anthropic.messages.create({
          model: config.anthropicModel,
          messages: [{ role: 'user', content: messageContent }],
          temperature: config.anthropicTemperature,
          max_tokens: 2000,
          stream: true
        });

        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            const content = chunk.delta.text;
            if (content) {
              res.write(`data: ${JSON.stringify({ anthropic: content })}\n\n`);
            }
          }
        }
        
        anthropicComplete = true;
        if (openaiComplete) {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
        }
      } catch (error) {
        console.error('Anthropic stream error:', error);
        res.write(`data: ${JSON.stringify({ anthropicError: 'Error en Anthropic' })}\n\n`);
        anthropicComplete = true;
        if (openaiComplete) {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
        }
      }
    })();

    // Ejecutar ambos streams en paralelo
    await Promise.all([openaiPromise, anthropicPromise]);
  }
}
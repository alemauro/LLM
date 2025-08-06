import { Response } from 'express';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

interface StreamConfig {
  prompt: string;
  openaiModel: string;
  anthropicModel: string;
  openaiTemperature: number;
  anthropicTemperature: number;
}

export class StreamHelper {
  static async handleDualStream(
    openaiClient: OpenAI,
    anthropicClient: Anthropic,
    config: StreamConfig,
    res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    let openaiComplete = false;
    let anthropicComplete = false;

    // OpenAI Stream
    const openaiPromise = (async () => {
      try {
        const stream = await openaiClient.chat.completions.create({
          model: config.openaiModel,
          messages: [{ role: 'user', content: config.prompt }],
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
        const stream = await anthropicClient.messages.create({
          model: config.anthropicModel,
          messages: [{ role: 'user', content: config.prompt }],
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
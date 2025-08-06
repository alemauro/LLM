import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { HealthCheckResponse } from './types';
import llmRoutes from './routes/llm.routes';
import statisticsRoutes from './routes/statistics.routes';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/llm', llmRoutes);
app.use('/api/statistics', statisticsRoutes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  const response: HealthCheckResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: 'Dual LLM Server running correctly'
  };
  res.json(response);
});

// Servir archivos estáticos en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend')));
  
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  });
}

// Configuración del host según entorno
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

const server = app.listen(PORT, host, () => {
  console.log('🎉 DUAL LLM SERVER STARTED!');
  console.log(`🔌 Port: ${PORT}`);
  console.log(`🌐 Host: ${host}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('📚 API Endpoints:');
  console.log(`   POST /api/llm/generate - Generar respuestas de LLM`);
  console.log(`   GET  /api/llm/models - Obtener modelos disponibles`);
  console.log(`   GET  /api/statistics - Obtener estadísticas`);
  console.log(`   GET  /api/health - Health check`);
});

// Manejo de errores
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

export default server;
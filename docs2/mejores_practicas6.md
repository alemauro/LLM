# 🏆 Mejores Prácticas de Desarrollo v6.0 - Alejandro Mauro

## 🎯 Principios Fundamentales

### 🔒 **NUNCA HARDCODEAR VALORES**
- **URLs**: Siempre usar variables de entorno
- **API Keys**: En variables de entorno separadas
- **Configuraciones**: Parametrizables por entorno
- **Rutas**: Lógicas y configurables, nunca estáticas

```typescript
// ❌ MAL - Hardcodeado
const API_URL = 'https://api.ejemplo.com';

// ✅ BIEN - Variable de entorno
const API_URL = process.env.API_URL || 'http://localhost:3000';
```

### 🌍 **DESARROLLO LOCAL → PRODUCCIÓN DOCKERIZADA**
La aplicación debe funcionar perfectamente en:
1. **Desarrollo**: `npm run dev` en localhost
2. **Build local**: `npm run build` && `npm run start`
3. **Producción**: Deploy automático vía GitHub → Coolify → DigitalOcean Docker

### 🐳 **COMPATIBILIDAD DOCKER OBLIGATORIA**
- **Host binding**: `0.0.0.0` en producción, `127.0.0.1` en desarrollo
- **Puerto dinámico**: `process.env.PORT`
- **Variables de entorno**: Todas las configuraciones externalizadas
- **Health checks**: Obligatorios en `/api/health`

### ⚙️ **CONFIGURACIÓN DE MÓDULOS Y COMPILACIÓN**
Basado en la experiencia real de proyectos desplegados exitosamente:

#### TypeScript Configuration (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",  // CommonJS para compatibilidad
    "jsx": "react-jsx",    // Para proyectos React
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "exclude": ["src/frontend"]  // Frontend manejado por Vite
}
```

#### Vite Configuration (vite.config.ts)
```typescript
export default defineConfig({
  plugins: [react()],
  root: './src/frontend',
  publicDir: '../../public',
  build: {
    outDir: '../../dist/frontend',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || 'http://127.0.0.1:3000',
        changeOrigin: true
      }
    }
  }
});
```

---

## 🏗️ **ARQUITECTURA Y ESTRUCTURA**

### 📁 Estructura de Directorios Estándar
```
proyecto/
├── src/
│   ├── backend/
│   │   ├── controllers/     # Controladores REST
│   │   ├── services/        # Lógica de negocio
│   │   ├── routes/          # Definición de rutas
│   │   ├── middleware/      # Middlewares personalizados
│   │   ├── types/           # Tipos TypeScript
│   │   └── server.ts        # Servidor principal
│   └── frontend/
│       ├── components/      # Componentes React
│       ├── hooks/           # Hooks personalizados
│       ├── services/        # Cliente API
│       ├── styles/          # CSS/SCSS
│       ├── types/           # Tipos TypeScript
│       └── App.tsx          # Componente principal
├── public/                  # Assets estáticos
├── docs2/                   # Documentación del proyecto
├── data/                    # Datos persistentes (desarrollo)
├── uploads/                 # Archivos subidos
├── dist/                    # Build de producción
└── docker-compose.yml       # Para testing local
```

### 🎨 **CONSISTENCIA DE ESTILOS**
- **Clases CSS**: Definir sistema de clases reutilizables
- **Nombres**: Semánticos y consistentes
- **Componentes**: Reutilizables entre proyectos
- **Theme**: Seguir `docs2/theme/theme.md`

```css
/* Sistema de clases estándar */
.header { /* Header global */ }
.header-logo { /* Logo en header */ }
.tab-button { /* Botones de navegación */ }
.tab-button.active { /* Estado activo */ }
.modal-overlay { /* Overlay de modales */ }
.statistics-counter { /* Contador de estadísticas */ }
```

---

## 🔧 **PLANTILLAS DE CÓDIGO ESTÁNDAR**

### 🛣️ Template de Controlador
```typescript
// src/backend/controllers/ejemplo.controller.ts
import { Request, Response } from 'express';
import { EjemploService } from '../services/ejemplo.service';
import { StatisticsService } from '../services/statistics.service';

export class EjemploController {
  private ejemploService: EjemploService;
  private statisticsService: StatisticsService;

  constructor() {
    this.ejemploService = new EjemploService();
    this.statisticsService = StatisticsService.getInstance();
    
    // Binding obligatorio para métodos
    this.metodoEjemplo = this.metodoEjemplo.bind(this);
  }

  public async metodoEjemplo(req: Request, res: Response): Promise<void> {
    try {
      const { parametro } = req.body;
      
      // Validaciones
      if (!parametro) {
        res.status(400).json({
          success: false,
          error: 'Parámetro requerido'
        });
        return;
      }

      // Lógica de negocio
      const resultado = await this.ejemploService.procesar(parametro);
      
      // Incrementar estadísticas si aplica
      if (resultado.success) {
        this.statisticsService.incrementAnalysisCount();
      }

      res.json({
        success: true,
        data: resultado
      });
    } catch (error) {
      console.error('Error in metodoEjemplo:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
}
```

### 🔗 Template de Rutas
```typescript
// src/backend/routes/ejemplo.routes.ts
import { Router } from 'express';
import { EjemploController } from '../controllers/ejemplo.controller';
import { upload } from '../middleware/upload.middleware'; // Si aplica

const router = Router();
const ejemploController = new EjemploController();

// GET /api/ejemplo - Obtener elementos
router.get('/', ejemploController.obtenerElementos);

// POST /api/ejemplo - Crear elemento
router.post('/', ejemploController.crearElemento);

// POST /api/ejemplo/upload - Subir archivo (si aplica)
router.post('/upload', upload.single('archivo'), ejemploController.subirArchivo);

// Health check específico (opcional)
router.get('/health', ejemploController.healthCheck);

export default router;
```

### 🎣 Template de Hook React
```typescript
// src/frontend/hooks/useEjemplo.ts
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { EjemploData } from '../types';

export const useEjemplo = () => {
  const [data, setData] = useState<EjemploData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const resultado = await api.obtenerEjemplos();
      setData(resultado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: cargarDatos
  };
};
```

### 🖥️ Template de Componente React
```typescript
// src/frontend/components/EjemploComponent.tsx
import React, { useState } from 'react';
import { EjemploData } from '../types';

interface EjemploComponentProps {
  data: EjemploData[];
  onSelect: (item: EjemploData) => void;
  loading?: boolean;
}

const EjemploComponent: React.FC<EjemploComponentProps> = ({
  data,
  onSelect,
  loading = false
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (item: EjemploData) => {
    setSelectedId(item.id);
    onSelect(item);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="ejemplo-component">
      <h3 className="section-title">Ejemplos Disponibles</h3>
      <div className="ejemplo-grid">
        {data.map((item) => (
          <div
            key={item.id}
            className={`ejemplo-item ${selectedId === item.id ? 'selected' : ''}`}
            onClick={() => handleSelect(item)}
          >
            <h4>{item.nombre}</h4>
            <p>{item.descripcion}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EjemploComponent;
```

---

## 🧪 **TESTING OBLIGATORIO**

### 🔬 Pruebas Unitarias
```typescript
// src/backend/__tests__/ejemplo.controller.test.ts
import { EjemploController } from '../controllers/ejemplo.controller';
import { Request, Response } from 'express';

describe('EjemploController', () => {
  let controller: EjemploController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    controller = new EjemploController();
    mockRequest = {};
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  it('should handle valid request', async () => {
    mockRequest.body = { parametro: 'test' };
    
    await controller.metodoEjemplo(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      data: expect.any(Object)
    });
  });

  it('should handle missing parameter', async () => {
    mockRequest.body = {};
    
    await controller.metodoEjemplo(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
  });
});
```

### 🩺 Health Checks Obligatorios
```typescript
// Health check estándar para todas las APIs
app.get('/api/health', (_req, res) => {
  const response: HealthCheckResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: '[Nombre Proyecto] Server running correctly'
  };
  
  res.json(response);
});

// Health check específico con dependencias
app.get('/api/health/detailed', async (_req, res) => {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      database: await checkDatabase(),
      fileSystem: await checkFileSystem(),
      externalAPI: await checkExternalAPI()
    }
  };
  
  const hasErrors = Object.values(checks.checks).some(check => !check.healthy);
  res.status(hasErrors ? 503 : 200).json(checks);
});
```

---

## 🐛 **DEBUGGING Y LOGGING**

### 📋 Sistema de Debug Info
```typescript
// src/backend/controllers/debug.controller.ts
export class DebugController {
  public getDebugInfo(_req: Request, res: Response): void {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      environmentVars: {
        PORT: process.env.PORT,
        NODE_ENV: process.env.NODE_ENV,
        // Agregar otras variables relevantes (SIN SECRETS)
      },
      buildInfo: {
        version: process.env.npm_package_version,
        buildDate: process.env.BUILD_DATE,
        gitCommit: process.env.GIT_COMMIT
      }
    };

    res.json(debugInfo);
  }
}

// Ruta: GET /api/debug/info
```

### 📊 Logging Estructurado
```typescript
// src/backend/utils/logger.ts
class Logger {
  private log(level: string, message: string, meta?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta && { meta }),
      environment: process.env.NODE_ENV
    };

    console.log(JSON.stringify(logEntry));
  }

  info(message: string, meta?: any) {
    this.log('INFO', message, meta);
  }

  error(message: string, error?: Error, meta?: any) {
    this.log('ERROR', message, { 
      ...(error && { error: error.message, stack: error.stack }),
      ...meta 
    });
  }

  warn(message: string, meta?: any) {
    this.log('WARN', message, meta);
  }
}

export const logger = new Logger();
```

---

## 🗄️ **CONFIGURACIÓN DE BASE DE DATOS**

### 🔐 Manejo de Credenciales
```typescript
// src/backend/config/database.ts
export const databaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'app_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Variables de entorno en Coolify:
// DB_HOST=your-db-host
// DB_PORT=5432
// DB_USERNAME=your-username
// DB_PASSWORD=your-secure-password
// DB_NAME=your-database
```

### 📡 Connection Pool
```typescript
// src/backend/services/database.service.ts
import { Pool } from 'pg'; // Para PostgreSQL

export class DatabaseService {
  private static instance: DatabaseService;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool(databaseConfig);
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async query(text: string, params?: any[]) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      logger.error('Database health check failed', error);
      return false;
    }
  }
}
```

---

## 🔄 **INTEGRACIÓN CONTINUA**

### 📋 GitHub Actions Estándar
```yaml
# .github/workflows/deploy.yml
name: Deploy to Coolify

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linting
        run: npm run lint
      
      - name: Type check
        run: npm run typecheck
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to Coolify
        # Coolify maneja el deploy automáticamente desde GitHub
        run: echo "Deploy triggered automatically by Coolify"
```

### 🏷️ Versionado Semántico
```json
// package.json
{
  "version": "1.0.0",
  "scripts": {
    "version:patch": "npm version patch",
    "version:minor": "npm version minor", 
    "version:major": "npm version major"
  }
}
```

---

## 🔒 **SEGURIDAD**

### 🛡️ Middlewares de Seguridad
```typescript
// src/backend/middleware/security.middleware.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Rate limiting
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: 'Demasiadas peticiones desde esta IP',
  standardHeaders: true,
  legacyHeaders: false,
});

// Helmet configuration
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false // Para compatibilidad
});
```

### 🔑 Validación de Inputs
```typescript
// src/backend/middleware/validation.middleware.ts
import { body, validationResult } from 'express-validator';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Datos de entrada inválidos',
      details: errors.array()
    });
  }
  next();
};

// Ejemplo de validación
export const validateEjemplo = [
  body('email').isEmail().withMessage('Email inválido'),
  body('nombre').isLength({ min: 2, max: 50 }).withMessage('Nombre debe tener entre 2 y 50 caracteres'),
  validateRequest
];
```

---

## 📊 **MONITOREO Y MÉTRICAS**

### 📈 Métricas de Aplicación
```typescript
// src/backend/services/metrics.service.ts
export class MetricsService {
  private static instance: MetricsService;
  private metrics: Map<string, number> = new Map();

  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  increment(metric: string): void {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + 1);
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // Métricas automáticas
  recordResponseTime(route: string, duration: number): void {
    this.metrics.set(`response_time_${route}`, duration);
  }
}

// Middleware para métricas automáticas
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const metrics = MetricsService.getInstance();
    metrics.recordResponseTime(req.route?.path || req.path, duration);
    metrics.increment(`requests_${res.statusCode}`);
  });
  
  next();
};
```

---

## ✅ **CHECKLIST DE MEJORES PRÁCTICAS**

### 🏗️ Arquitectura
- [ ] Estructura de directorios estándar implementada
- [ ] Variables de entorno para todas las configuraciones
- [ ] Servicios singleton para recursos compartidos
- [ ] Separación clara entre capas (controller, service, routes)

### 🔧 Código
- [ ] Templates estándar aplicados para controladores/rutas
- [ ] Binding de métodos en constructores
- [ ] Manejo de errores consistente con try/catch
- [ ] Tipos TypeScript definidos para todas las interfaces

### 🧪 Testing
- [ ] Pruebas unitarias para controladores críticos
- [ ] Health checks implementados (`/api/health`)
- [ ] Debug info endpoint configurado (`/api/debug/info`)
- [ ] Logging estructurado implementado

### 🔒 Seguridad
- [ ] Rate limiting configurado
- [ ] Helmet middleware aplicado
- [ ] Validación de inputs implementada
- [ ] Credenciales en variables de entorno

### 🚀 Deploy
- [ ] Dockerfile multi-stage configurado
- [ ] Health checks para Coolify
- [ ] Scripts npm estándar funcionando
- [ ] Variables de entorno documentadas

### 📊 Monitoreo
- [ ] Sistema de estadísticas implementado
- [ ] Métricas de aplicación configuradas
- [ ] Logs estructurados funcionando
- [ ] Debug endpoints accesibles

---

**📅 Actualizado:** Agosto 2025  
**📋 Versión:** 6.0  
**👨‍💻 Autor:** Alejandro Mauro  
**🎯 Uso:** Guía de mejores prácticas para todos los proyectos
# Sistema de Estadísticas para Aplicaciones con Deploy en Coolify

Este documento describe la implementación completa de un sistema de estadísticas persistentes que funciona tanto en desarrollo local como en producción con Coolify.

## 📊 Arquitectura del Sistema

### Componentes Principales

1. **StatisticsService**: Servicio singleton para manejo de estadísticas
2. **StatisticsController**: Controlador REST API para operaciones CRUD
3. **Persistent Storage**: Sistema de archivos para persistir datos
4. **Real-time Updates**: WebSocket para actualizaciones en tiempo real

## 🗂️ Estructura de Archivos

```
src/
├── services/
│   └── statistics.service.ts    # Servicio principal de estadísticas
├── controllers/
│   └── statistics.controller.ts # Controlador REST API
├── routes/
│   └── statistics.routes.ts     # Rutas de la API
└── types/
    └── statistics.types.ts      # Definiciones TypeScript

client/src/
├── components/layout/
│   └── Header.tsx              # Componente que muestra estadísticas
├── services/
│   └── api.ts                  # Cliente API para estadísticas
└── types/
    └── index.ts                # Tipos TypeScript del frontend
```

## 🛠️ Implementación Backend

### 1. Modelo de Datos (TypeScript)

```typescript
// src/types/statistics.types.ts
export interface Statistics {
  promptsImproved: number;
  lastUpdated: string;
}

export interface StatisticsData {
  promptsImproved: number;
  lastUpdated: Date;
}
```

### 2. Servicio de Estadísticas (Singleton Pattern)

```typescript
// src/services/statistics.service.ts
import fs from 'fs';
import path from 'path';
import { Statistics, StatisticsData } from '../types/statistics.types';
import { io } from '../server'; // Socket.io instance

export class StatisticsService {
  private static instance: StatisticsService;
  private stats: StatisticsData;
  private readonly dataDir: string;
  private readonly filePath: string;

  private constructor() {
    // Configuración de rutas basada en entorno
    this.dataDir = process.env.NODE_ENV === 'production' ? '/app/data' : './data';
    this.filePath = path.join(this.dataDir, 'statistics.json');
    
    this.ensureDataDirectory();
    this.stats = this.loadStatistics();
  }

  public static getInstance(): StatisticsService {
    if (!StatisticsService.instance) {
      StatisticsService.instance = new StatisticsService();
    }
    return StatisticsService.instance;
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      console.log(`📁 Directorio de datos creado: ${this.dataDir}`);
    }
  }

  private loadStatistics(): StatisticsData {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(data);
        return {
          promptsImproved: parsed.promptsImproved || 0,
          lastUpdated: new Date(parsed.lastUpdated || new Date())
        };
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }

    // Valores por defecto si no existe el archivo o hay error
    return {
      promptsImproved: 0,
      lastUpdated: new Date()
    };
  }

  private saveStatistics(): void {
    try {
      const dataToSave = {
        promptsImproved: this.stats.promptsImproved,
        lastUpdated: this.stats.lastUpdated.toISOString()
      };
      
      fs.writeFileSync(this.filePath, JSON.stringify(dataToSave, null, 2));
      console.log(`📊 Statistics updated: ${this.stats.promptsImproved} prompts improved`);
    } catch (error) {
      console.error('Error saving statistics:', error);
    }
  }

  public getStatistics(): Statistics {
    return {
      promptsImproved: this.stats.promptsImproved,
      lastUpdated: this.stats.lastUpdated.toISOString()
    };
  }

  public incrementPromptsImproved(): void {
    this.stats.promptsImproved++;
    this.stats.lastUpdated = new Date();
    this.saveStatistics();
    
    // Emitir actualización en tiempo real via WebSocket
    io.emit('statistics-updated', this.getStatistics());
  }

  public resetStatistics(): Statistics {
    this.stats.promptsImproved = 0;
    this.stats.lastUpdated = new Date();
    this.saveStatistics();
    
    // Emitir actualización en tiempo real via WebSocket
    io.emit('statistics-updated', this.getStatistics());
    
    return this.getStatistics();
  }
}
```

### 3. Controlador REST API

```typescript
// src/controllers/statistics.controller.ts
import { Request, Response } from 'express';
import { StatisticsService } from '../services/statistics.service';

export class StatisticsController {
  private statisticsService: StatisticsService;

  constructor() {
    this.statisticsService = StatisticsService.getInstance();
    
    // Binding de métodos para evitar problemas de contexto
    this.getStatistics = this.getStatistics.bind(this);
    this.resetStatistics = this.resetStatistics.bind(this);
  }

  public getStatistics = (_req: Request, res: Response): void => {
    try {
      const stats = this.statisticsService.getStatistics();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener estadísticas'
      });
    }
  };

  public resetStatistics = (_req: Request, res: Response): void => {
    try {
      const stats = this.statisticsService.resetStatistics();
      res.json({
        success: true,
        message: 'Estadísticas reiniciadas correctamente',
        data: stats
      });
    } catch (error) {
      console.error('Error resetting statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Error al reiniciar estadísticas'
      });
    }
  };
}
```

### 4. Rutas de la API

```typescript
// src/routes/statistics.routes.ts
import { Router } from 'express';
import { StatisticsController } from '../controllers/statistics.controller';

const router = Router();
const statisticsController = new StatisticsController();

// GET /api/statistics - Obtener estadísticas actuales
router.get('/', statisticsController.getStatistics);

// POST /api/statistics/reset - Reiniciar estadísticas (solo para desarrollo/admin)
router.post('/reset', statisticsController.resetStatistics);

export default router;
```

### 5. Integración en Controladores Principales

```typescript
// src/controllers/metaprompting.controller.ts
import { StatisticsService } from '../services/statistics.service';

export class MetapromptingController {
  private statisticsService: StatisticsService;

  constructor() {
    this.statisticsService = StatisticsService.getInstance();
    
    // Binding de métodos
    this.createSession = this.createSession.bind(this);
    // ... otros métodos
  }

  async createSession(req: Request, res: Response): Promise<void> {
    try {
      const { prompt } = req.body;
      
      // Validaciones...
      
      const session = await metapromptingService.startSession(prompt);
      
      // ✅ INCREMENTAR ESTADÍSTICAS AQUÍ
      this.statisticsService.incrementPromptsImproved();
      
      res.json({ session });
    } catch (error) {
      // Manejo de errores...
    }
  }
}
```

## 🎨 Implementación Frontend

### 1. Servicio API Cliente

```typescript
// client/src/services/api.ts
export const api = {
  // ... otras funciones ...

  getStatistics: async (): Promise<Statistics> => {
    const response = await axios.get(`${API_BASE_URL}/statistics`);
    return response.data.data;
  },

  resetStatistics: async (): Promise<Statistics> => {
    const response = await axios.post(`${API_BASE_URL}/statistics/reset`);
    return response.data.data;
  }
};
```

### 2. Componente Header con Estadísticas

```typescript
// client/src/components/layout/Header.tsx
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Statistics } from '../../types';
import { io, Socket } from 'socket.io-client';

const Header: React.FC<HeaderProps> = ({ onShowAboutModal }) => {
  const [statistics, setStatistics] = useState<Statistics>({ 
    promptsImproved: 0, 
    lastUpdated: '' 
  });
  const [, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Cargar estadísticas iniciales
    loadStatistics();

    // Configurar WebSocket para actualizaciones en tiempo real
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const socketUrl = isProduction ? window.location.origin : 'http://localhost:3001';
      
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    // Escuchar actualizaciones de estadísticas
    newSocket.on('statistics-updated', (updatedStats: Statistics) => {
      setStatistics(updatedStats);
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  const loadStatistics = async () => {
    try {
      const stats = await api.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <img src="/logo-compacto.png" alt="Logo" className="header-logo" />
          <h1 className="header-title">Metaprompting (Infomed Guru)</h1>
        </div>
        
        <div className="header-center">
          <div className="statistics-counter">
            <span className="statistics-label">Prompts Mejorados:</span>
            <span className="statistics-value">
              {statistics.promptsImproved.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="header-right">
          <button 
            type="button"
            onClick={onShowAboutModal}
            className="about-button"
            title="Información sobre Metaprompting"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9,9h0a3,3,0,0,1,6,0c0,2-3,3-3,3"/>
              <path d="M12,17h.01"/>
            </svg>
            Acerca de
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
```

## 🚀 Configuración de Deploy

### Coolify Configuration

1. **Persistent Storage**:
   - **Source**: Cualquier nombre descriptivo (ej: `metaprompting-data`)
   - **Destination Path**: `/app/data`
   - **Type**: Directory

2. **Environment Variables**:
   ```bash
   NODE_ENV=production
   PORT=3000
   # Otras variables específicas del proyecto
   ```

3. **Build Configuration**:
   ```dockerfile
   # En tu Dockerfile
   # Crear directorio para datos en producción
   RUN mkdir -p /app/data
   ```

### Estructura de Directorios

```
Desarrollo Local:
project-root/
├── data/
│   └── statistics.json
└── src/

Producción (Coolify):
/app/
├── data/               # <- Mounted volume
│   └── statistics.json
├── dist/
└── node_modules/
```

## 🔄 Flujo de Funcionamiento

### 1. Inicialización
1. **StatisticsService** se instancia como singleton
2. Verifica/crea directorio de datos según el entorno
3. Carga estadísticas existentes o inicializa valores por defecto

### 2. Incremento de Estadísticas
1. Usuario realiza una acción que debe ser contabilizada
2. Controlador llama a `statisticsService.incrementPromptsImproved()`
3. Servicio actualiza contador y guarda en archivo
4. Emite evento WebSocket a todos los clientes conectados
5. Frontend actualiza interfaz en tiempo real

### 3. Persistencia
- **Local**: `./data/statistics.json`
- **Producción**: `/app/data/statistics.json` (volume montado)
- Formato JSON con timestamp de última actualización

### 4. Recuperación ante Fallos
- Si falla la carga: usa valores por defecto
- Si falla el guardado: registra error pero continúa funcionando
- Directorio se crea automáticamente si no existe

## 🧪 Testing y Debugging

### Comandos Útiles

```bash
# Verificar archivo de estadísticas en desarrollo
cat ./data/statistics.json

# Verificar archivo de estadísticas en producción (Coolify)
docker exec -it <container-id> cat /app/data/statistics.json

# Reiniciar estadísticas via API
curl -X POST http://localhost:3001/api/statistics/reset

# Obtener estadísticas via API
curl http://localhost:3001/api/statistics
```

### Logs de Debug

El sistema incluye logs informativos:
```
📁 Directorio de datos creado: /app/data
📊 Statistics updated: 5 prompts improved
```

## 🔧 Customización para Otros Proyectos

### 1. Cambiar Métricas

```typescript
// Extender interface Statistics
export interface Statistics {
  promptsImproved: number;
  sessionsCreated: number;    // Nueva métrica
  totalUsers: number;         // Nueva métrica
  lastUpdated: string;
}

// Agregar métodos al service
public incrementSessions(): void {
  this.stats.sessionsCreated++;
  this.stats.lastUpdated = new Date();
  this.saveStatistics();
  io.emit('statistics-updated', this.getStatistics());
}
```

### 2. Diferentes Puntos de Incremento

```typescript
// En diferentes controladores según tu lógica de negocio
export class UserController {
  async registerUser() {
    // ... lógica de registro
    this.statisticsService.incrementUsers();
  }
}

export class SessionController {
  async createSession() {
    // ... lógica de sesión
    this.statisticsService.incrementSessions();
  }
}
```

### 3. Configuraciones Específicas por Proyecto

```typescript
// config/statistics.config.ts
export const STATISTICS_CONFIG = {
  dataDir: process.env.STATISTICS_DIR || (process.env.NODE_ENV === 'production' ? '/app/data' : './data'),
  fileName: process.env.STATISTICS_FILE || 'statistics.json',
  enableRealTime: process.env.ENABLE_REALTIME_STATS !== 'false',
  autoSave: process.env.AUTO_SAVE_STATS !== 'false'
};
```

## ⚠️ Consideraciones Importantes

### Seguridad
- Endpoint de reset solo para desarrollo/admin
- Validar permisos antes de modificar estadísticas
- No exponer información sensible en estadísticas públicas

### Performance
- Operaciones de archivo son síncronas pero rápidas
- Considerar cache en memoria para proyectos de alto tráfico
- WebSocket events son eficientes para updates en tiempo real

### Escalabilidad
- Para múltiples instancias, considerar Redis o base de datos
- Volume sharing funciona bien para instancia única en Coolify
- Archivo JSON es suficiente para aplicaciones pequeñas-medianas

## 📝 Checklist de Implementación

- [ ] Crear tipos TypeScript para estadísticas
- [ ] Implementar StatisticsService con patrón singleton
- [ ] Crear controlador y rutas REST API
- [ ] Configurar persistent storage en Coolify
- [ ] Integrar incrementos en controladores principales
- [ ] Crear componente frontend con WebSocket updates
- [ ] Configurar variables de entorno por ambiente
- [ ] Testear funcionamiento en desarrollo y producción
- [ ] Documentar métricas específicas del proyecto
- [ ] Configurar logs y debugging appropriados

Este sistema te permitirá reutilizar la funcionalidad de estadísticas en cualquier proyecto similar con deploy en Coolify, adaptando solo las métricas específicas y los puntos de incremento según la lógica de negocio de cada aplicación.
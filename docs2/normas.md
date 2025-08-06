# 📋 Normas de Desarrollo UX/UI - Proyectos Alejandro Mauro

## 🎯 Objetivo
Este documento establece las normas consolidadas para construir aplicaciones web consistentes, incluyendo UX/UI, manejo de estadísticas, y configuración de despliegue en Coolify.

---

## 🎨 **TEMA Y DISEÑO VISUAL**

### 📁 Recursos Gráficos Obligatorios
Todos los proyectos deben incluye la carpeta `docs/theme/` con:

```
docs/theme/
├── favicon.png              # 32x32px - Favicon del sitio
├── logo-compacto.png        # Logo principal compacto para header
├── logo-cursos-informed.svg # Logo vectorial alternativo
├── fondo_abstracto.png      # Imagen de fondo opcional
├── UX-UI-ejemplo.png        # Referencia visual del diseño target
├── UX-UI-ejemplo-modal.png  # Referencia del modal de información
└── theme.md                 # Definición completa del tema
```

### 🎨 Paleta de Colores Estándar

#### Colores Primarios
- **Primary**: `#2563eb` (Blue 600) - Color principal para botones y acentos
- **Primary Hover**: `#1d4ed8` (Blue 700) - Estado hover para elementos primarios
- **Primary Light**: `#dbeafe` (Blue 100) - Fondos claros y destacados sutiles

#### Colores Neutrales
- **Background**: `#ffffff` (White) - Fondo principal
- **Surface**: `#f9fafb` (Gray 50) - Tarjetas y superficies elevadas
- **Border**: `#e5e7eb` (Gray 300) - Bordes y divisores
- **Text Primary**: `#111827` (Gray 900) - Color de texto principal
- **Text Secondary**: `#6b7280` (Gray 500) - Texto secundario y etiquetas
- **Text Muted**: `#9ca3af` (Gray 400) - Estados deshabilitados y hints

#### Colores Semánticos
- **Success**: `#10b981` (Emerald 500) - Estados de éxito
- **Error**: `#ef4444` (Red 500) - Estados de error
- **Warning**: `#f59e0b` (Amber 500) - Estados de advertencia
- **Info**: `#3b82f6` (Blue 500) - Estados informativos

### 🔤 Tipografía Estándar
- **H1**: `text-4xl font-bold` (36px, 700) - Títulos de página
- **H2**: `text-3xl font-semibold` (30px, 600) - Encabezados de sección
- **H3**: `text-2xl font-semibold` (24px, 600) - Subencabezados
- **H4**: `text-xl font-medium` (20px, 500) - Títulos de tarjetas
- **Body**: `text-base` (16px) - Texto estándar del cuerpo
- **Small**: `text-sm` (14px) - Información secundaria

---

## 🏗️ **ESTRUCTURA DE LAYOUT OBLIGATORIA**

### 📱 Header Estándar
**Estructura requerida:**
```html
<header className="header">
  <div className="header-content">
    <!-- Logo + Título (Izquierda) -->
    <div className="header-left">
      <img src="/logo-compacto.png" alt="Logo" className="header-logo" />
      <h1 className="header-title">TÍTULO DE LA APLICACIÓN</h1>
    </div>
    
    <!-- Estadísticas (Centro) -->
    <div className="header-center">
      <div className="statistics-counter">
        <span className="statistics-label">Métrica:</span>
        <span className="statistics-value">
          {statistics.count.toLocaleString()}
        </span>
      </div>
    </div>

    <!-- Botón Acerca de (Derecha) -->
    <div className="header-right">
      <button 
        type="button"
        onClick={onShowAboutModal}
        className="about-button"
        title="Información sobre la aplicación"
      >
        <svg><!-- Icono info --></svg>
        Acerca de
      </button>
    </div>
  </div>
</header>
```

### 🖼️ Logo Requirements
- **Archivo**: `logo-compacto.png`
- **Ubicación**: `/public/logo-compacto.png`
- **Tamaño recomendado**: Máximo 120px de ancho, 40px de alto
- **Formato**: PNG con transparencia
- **Uso**: Header principal de todas las aplicaciones

### 🌐 Favicon Configuration
- **Archivo**: `favicon.ico` o `favicon.png`
- **Tamaño**: 32x32px
- **Ubicación**: `/public/favicon.ico` o `/public/favicon.png`
- **HTML**: Automático en React/Vite

### 🎛️ Navegación Principal
**Estructura de tabs obligatoria:**
```html
<div className="tab-navigation">
  <button className={`tab-button ${activeTab === 'option1' ? 'active' : ''}`}>
    Opción Principal
  </button>
  <button className={`tab-button ${activeTab === 'option2' ? 'active' : ''}`}>
    Opción Secundaria
  </button>
</div>
```

### 📋 Modal de Información Estándar
**Estructura requerida para "Acerca de":**
```jsx
<Modal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} title="Acerca del [Proyecto]">
  <div className="modal-text">
    <p><strong>Tecnología:</strong> Descripción técnica</p>
    <p><strong>Precisión/Rendimiento:</strong> Métricas clave</p>
    <p><strong>Fecha de creación:</strong> DD de MM de YYYY (creado por Alejandro Mauro)</p>
    <p><strong>Funcionalidades:</strong></p>
    <ul>
      <li>Funcionalidad 1</li>
      <li>Funcionalidad 2</li>
    </ul>
    <p><strong>Datos/Fuentes:</strong></p>
    <p>Información sobre datasets, APIs o fuentes utilizadas</p>
  </div>
  <div className="modal-text">
    <p><strong>Limitaciones:</strong></p>
    <p>Descripción clara de limitaciones técnicas o de uso</p>
  </div>
  <div className="modal-text">
    <p><strong>⚠️ Importante:</strong> Disclaimers legales o de uso según el tipo de aplicación</p>
  </div>
</Modal>
```

---

## 📊 **SISTEMA DE ESTADÍSTICAS OBLIGATORIO**

### 🗂️ Estructura de Archivos Requerida
```
src/backend/
├── services/
│   └── statistics.service.ts    # Servicio singleton de estadísticas
├── controllers/
│   └── statistics.controller.ts # Controlador REST API
├── routes/
│   └── statistics.routes.ts     # Rutas /api/statistics
└── types/
    └── index.ts                 # Tipos TypeScript

src/frontend/
├── hooks/
│   └── useStatistics.ts         # Hook React para estadísticas
└── services/
    └── api.ts                   # Cliente API
```

### 📈 Implementación del Servicio (Patrón Singleton)
```typescript
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

  // Métodos de incremento específicos por proyecto
  public incrementAnalysisCount(): void {
    this.stats.analysisCount++;
    this.stats.lastUpdated = new Date();
    this.saveStatistics();
  }
  
  // Método para obtener estadísticas
  public getStatistics(): Statistics {
    return {
      analysisCount: this.stats.analysisCount,
      lastUpdated: this.stats.lastUpdated.toISOString()
    };
  }
}
```

### 🌐 API Endpoints Obligatorios
- **GET** `/api/statistics` - Obtener estadísticas actuales
- **POST** `/api/statistics/reset` - Reiniciar estadísticas (solo desarrollo)
- **GET** `/api/health` - Health check obligatorio

### 💾 Persistencia de Datos
**Estructura de archivo JSON:**
```json
{
  "analysisCount": 0,
  "lastUpdated": "2025-08-04T00:00:00.000Z"
}
```

**Ubicaciones según entorno:**
- **Desarrollo**: `./data/statistics.json`
- **Producción**: `/app/data/statistics.json` (volume montado)

---

## 🚀 **CONFIGURACIÓN DE DESPLIEGUE COOLIFY**

### 🐳 Dockerfile Estándar (Multi-stage)
```dockerfile
# Multi-stage build para optimizar tamaño
FROM node:22-alpine AS base
WORKDIR /app

# Stage 1: Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Stage 2: Build application
FROM deps AS builder
COPY . .
RUN npm run build

# Stage 3: Production image
# NOTA: Usar alpine por defecto, cambiar a bullseye-slim si necesitas Python/ML
FROM node:22-alpine AS production
# FROM node:22-bullseye-slim AS production  # Usar si necesitas Python
WORKDIR /app

# Instalar dependencias del sistema según necesidades
# Para Alpine:
RUN apk add --no-cache curl
# Para Debian/Ubuntu (si usas bullseye-slim):
# RUN apt-get update && apt-get install -y \
#     python3 python3-pip curl \
#     && rm -rf /var/lib/apt/lists/*

# Instalar solo dependencias de producción
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar builds compilados
COPY --from=builder /app/dist ./dist

# Copiar recursos necesarios del proyecto
# COPY ./public ./public  # Si tienes archivos públicos
# COPY ./modelo ./modelo  # Si tienes modelos ML
# COPY ./datos_ejemplo ./datos_ejemplo  # Si tienes datos de ejemplo
# COPY ./images ./images  # Si tienes imágenes de ejemplo

# Crear estructura de directorios para datos persistentes
RUN mkdir -p uploads logs data && \
    chown -R node:node /app uploads logs data

# Usuario no-root para seguridad
USER node

# Puerto estándar
EXPOSE 3000

# Health check para Coolify
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Comando de inicio
CMD ["node", "dist/backend/server.js"]
```

### 📂 Configuración de Volúmenes en Coolify
**Persistent Storage requerido:**
- **Source**: `[proyecto]-data`
- **Destination**: `/app/data`
- **Type**: Directory

### 🔧 Variables de Entorno Obligatorias
```env
NODE_ENV=production                    # Automática en Coolify
PORT=3000                             # Detectado automáticamente
# Variables específicas del proyecto según necesidades
```

### 🏥 Health Check Obligatorio
```typescript
app.get('/api/health', (_req, res) => {
  const response: HealthCheckResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: '[Nombre Proyecto] Server running correctly'
  };
  res.json(response);
});
```

### 🌍 Configuración de Host
```typescript
// Desarrollo vs Producción
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

const server = app.listen(PORT, host, () => {
  console.log(`🎉 [PROYECTO] SERVER STARTED!`);
  console.log(`🔌 Port: ${PORT}`);
  console.log(`🌐 Host: ${host}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
```

---

## 📜 **SCRIPTS NPM OBLIGATORIOS**

### package.json - Scripts Estándar
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "nodemon src/backend/server.ts",
    "dev:frontend": "vite",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "vite build",
    "build:backend": "tsc",
    "start": "node dist/backend/server.js",
    "test": "jest",
    "lint": "eslint src --ext .ts,.tsx",
    "typecheck": "tsc --noEmit"
  }
}
```

### 🔧 Configuración de Vite Estándar
```typescript
export default defineConfig({
  plugins: [react()],
  root: './src/frontend',
  publicDir: '../../public',
  build: {
    outDir: '../../dist/frontend',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || 'http://127.0.0.1:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: process.env.BACKEND_URL || 'http://127.0.0.1:3000',
        changeOrigin: true
      }
    }
  }
});
```

---

## ✅ **CHECKLIST DE IMPLEMENTACIÓN**

### 🎨 Diseño Visual
- [ ] Carpeta `docs/theme/` copiada con todos los recursos
- [ ] `favicon.png` configurado en `/public/favicon.png`
- [ ] `logo-compacto.png` configurado en `/public/logo-compacto.png`
- [ ] Paleta de colores implementada según `theme.md`
- [ ] Header con estructura estándar (logo, título, estadísticas, botón info)
- [ ] Modal "Acerca de" con información completa del proyecto

### 📊 Sistema de Estadísticas
- [ ] `StatisticsService` implementado con patrón singleton
- [ ] Controlador y rutas REST API configurados
- [ ] Persistencia en archivo JSON funcional
- [ ] Component React con hook `useStatistics`
- [ ] Integración en puntos relevantes de la aplicación
- [ ] Configuración de volumen persistente en Coolify

### 🚀 Despliegue
- [ ] Dockerfile multi-stage configurado
- [ ] Health check en `/api/health` implementado
- [ ] Scripts npm estándar configurados
- [ ] Variables de entorno definidas
- [ ] Host binding correcto (127.0.0.1 dev, 0.0.0.0 prod)
- [ ] Usuario no-root configurado en Docker

### 🧪 Testing
- [ ] Funcionamiento local con `npm run dev`
- [ ] Build exitoso con `npm run build`
- [ ] Health check respondiendo correctamente
- [ ] Estadísticas persistiendo entre reinicios
- [ ] Deploy exitoso en Coolify

---

## 📚 **ARCHIVOS DE REFERENCIA**

Este documento debe usarse junto con:
- `docs2/mejores_practicas6.md` - Mejores prácticas de desarrollo
- `docs2/theme/theme.md` - Definición completa del tema
- `docs2/theme/UX-UI-ejemplo.png` - Referencia visual del diseño

---

**📅 Creado:** Agosto 2025  
**👨‍💻 Autor:** Alejandro Mauro  
**🎯 Uso:** Normas estándar para todos los proyectos web
# 🐳 Guía de Despliegue Docker en Coolify - Proyecto RESNET50

## 📋 Resumen Ejecutivo

Este documento detalla la implementación exitosa de Docker en el proyecto RESNET50 para despliegue en Coolify. Esta configuración ha sido probada y es funcional, sirviendo como modelo para futuros proyectos.

## 🏗️ Arquitectura de Despliegue

### Estrategia Utilizada
- **Multi-stage Docker build** para optimización de tamaño
- **Express.js como servidor único** sirviendo tanto API como frontend estático
- **Healthcheck integrado** para monitoreo de Coolify
- **Configuración de producción optimizada**

## 📁 Estructura de Archivos Docker

### 1. Dockerfile (Multi-stage Build)

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

# Stage 3: Production image simplificado para Coolify
FROM node:22-alpine AS production
WORKDIR /app

# Instalar curl para healthcheck
RUN apk add --no-cache curl

# Instalar solo dependencias de producción
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar builds desde el stage anterior
COPY --from=builder /app/dist ./dist

# Copiar imágenes de ejemplo
COPY ./images ./images

# Crear estructura de directorios necesaria
RUN mkdir -p uploads logs data && \
    chown -R node:node /app uploads logs images data

# Cambiar permisos para usuario node
RUN chown -R node:node /app

# Crear usuario no-root para seguridad
USER node

# Exponer puerto de Express
EXPOSE 3000

# Health check simplificado para Coolify
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Iniciar directamente Express
CMD ["node", "dist/backend/server.js"]
```

### 2. docker-compose.yml (Para desarrollo y testing)

```yaml
version: '3.8'

services:
  # Aplicación principal RESNET50 simplificada para Coolify
  resnet50-app:
    build: 
      context: .
      dockerfile: Dockerfile
    container_name: resnet50-express
    ports:
      # Express directo
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - HUGGINGFACE_API_KEY=${HUGGINGFACE_API_KEY}
    volumes:
      # Persistir uploads
      - ./uploads:/app/uploads
      # Persistir logs
      - ./logs:/app/logs
    networks:
      - resnet50-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 15s
      retries: 3
      start_period: 60s

# Red personalizada
networks:
  resnet50-network:
    driver: bridge
```

## 🔧 Configuración del Backend

### server.ts - Configuración de Producción

```typescript
// Health check para Coolify
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        message: 'Express server running correctly'
    });
});

// Servir archivos estáticos del frontend en producción
const frontendPath = path.join(__dirname, '../../dist/frontend');
app.use(express.static(frontendPath));

// SPA Fallback crítico para React Router
app.get('*', (req, res) => {
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Frontend not found');
    }
});

// Bind a todas las interfaces para Docker
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎉 EXPRESS SERVER STARTED!`);
    console.log(`🔌 Port: ${PORT}`);
    console.log(`🌐 Host: 0.0.0.0 (Docker compatible)`);
});
```

## 📦 Scripts de Build

### package.json - Scripts Optimizados

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "nodemon src/backend/server.ts",
    "dev:frontend": "vite",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "vite build",
    "build:backend": "tsc",
    "start": "node dist/backend/server.js"
  }
}
```

### vite.config.ts - Configuración de Build

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
    host: true,  // Importante para Docker
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
      '/images': 'http://localhost:3000'
    }
  }
});
```

## 🚀 Despliegue en Coolify

### Proceso de Despliegue Automático

1. **Detección Automática**: Coolify detecta el Dockerfile automáticamente
2. **Build Multi-stage**: Se ejecutan los 3 stages del Dockerfile
3. **Optimización**: Solo dependencias de producción en imagen final
4. **Health Check**: Coolify monitorea `/api/health`
5. **Auto-restart**: En caso de fallos

### Variables de Entorno Requeridas

```env
# Variables críticas para Coolify
NODE_ENV=production                    # Automática en Coolify
PORT=3000                             # Detectado automáticamente
HUGGINGFACE_API_KEY=your-hf-token     # CONFIGURAR MANUALMENTE
```

### Configuración en Coolify

1. **Conectar repositorio GitHub**
2. **Coolify detecta Dockerfile automáticamente**
3. **Configurar variables de entorno**:
   - `HUGGINGFACE_API_KEY`: Token de HuggingFace
4. **Deploy automático**

## 📊 Estructura de Directorios en Contenedor

```
/app/
├── dist/
│   ├── backend/          # Servidor Express compilado
│   └── frontend/         # Assets React optimizados
├── images/               # Imágenes de ejemplo
├── uploads/              # Archivos subidos por usuarios
├── logs/                 # Logs de aplicación
├── data/                 # Datos persistentes
├── node_modules/         # Solo dependencias de producción
└── package.json
```

## 🔍 Optimizaciones Implementadas

### 1. Multi-stage Build
- **Stage 1 (deps)**: Instala todas las dependencias
- **Stage 2 (builder)**: Compila frontend y backend
- **Stage 3 (production)**: Solo dependencias de producción + builds

### 2. Seguridad
- Usuario `node` no-root
- Permisos correctos en directorios
- Health check para monitoreo

### 3. Optimización de Tamaño
- `npm ci --only=production`
- `npm cache clean --force`
- Solo archivos necesarios en imagen final

### 4. Compatibilidad con Coolify
- Bind a `0.0.0.0` para Docker
- Health check en `/api/health`
- Variables de entorno dinámicas

## ✅ Ventajas de Esta Implementación

### 1. **Servidor Único Simplificado**
- Express.js sirve tanto API como frontend estático
- No necesidad de proxy reverso
- Configuración más simple

### 2. **Build Optimizado**
- Imagen final pequeña (solo producción)
- Builds rápidos con cache de Docker
- Assets optimizados con Vite

### 3. **Monitoreo Integrado**
- Health check nativo
- Logs centralizados
- Restart automático

### 4. **Desarrollo/Producción Paridad**
- Mismo Dockerfile para ambos entornos
- Scripts npm consistentes
- Variables de entorno unificadas

## 📋 Checklist para Futuros Proyectos

### ✅ Dockerfile
- [ ] Multi-stage build implementado
- [ ] Usuario no-root configurado
- [ ] Health check incluido
- [ ] Variables de entorno definidas
- [ ] Bind a `0.0.0.0`

### ✅ package.json
- [ ] Script `build` que compile frontend y backend
- [ ] Script `start` para producción
- [ ] Dependencias organizadas correctamente

### ✅ Backend
- [ ] Endpoint `/api/health` implementado
- [ ] Servidor estático para frontend
- [ ] SPA fallback configurado
- [ ] Port dinámico desde `process.env.PORT`

### ✅ Frontend
- [ ] Build optimizado con Vite/Webpack
- [ ] Assets en directorio específico
- [ ] Proxy configuration para desarrollo

### ✅ Variables de Entorno
- [ ] `NODE_ENV=production` configurado
- [ ] Port dinámico
- [ ] API keys en variables separadas

## 🎯 Recomendaciones para Futuros Proyectos

### 1. **Mantener Arquitectura Simple**
- Un solo servidor Express sirviendo todo
- Evitar microservicios innecesarios
- Health checks simples pero efectivos

### 2. **Optimizar para Coolify**
- Dockerfile self-contained
- Variables de entorno dinámicas
- Health checks compatibles

### 3. **Seguridad por Defecto**
- Usuario no-root siempre
- Permisos mínimos necesarios
- No exponer puertos innecesarios

### 4. **Monitoreo y Logs**
- Health check endpoint estándar
- Logs estructurados
- Error handling centralizado

## 📚 Recursos y Referencias

- **Coolify Documentation**: https://coolify.io/docs
- **Docker Multi-stage Builds**: https://docs.docker.com/develop/dev-best-practices/
- **Express.js Production**: https://expressjs.com/en/advanced/best-practice-performance.html
- **Vite Build Guide**: https://vitejs.dev/guide/build.html

---

**📅 Creado:** Agosto 2025  
**🚀 Estado:** Probado y Funcional  
**📋 Uso:** Plantilla para futuros proyectos Docker + Coolify
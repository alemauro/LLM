# 📚 Lecciones Aprendidas - Proyecto ECG Classifier

## 🎯 Resumen
Este documento captura las lecciones aprendidas durante el desarrollo y despliegue exitoso del proyecto ECG Classifier en Coolify, que sirven como referencia para futuros proyectos.

## ✅ **Decisiones Exitosas**

### 1. **Arquitectura de Servidor Único**
- Express.js sirviendo tanto API como frontend en producción
- Simplifica el despliegue y reduce complejidad
- Elimina necesidad de proxy reverso adicional

### 2. **Sistema de Estadísticas Persistente**
- Patrón Singleton para el servicio
- Archivo JSON para persistencia simple
- Directorio `/app/data` montado como volumen en Coolify
- Funciona perfectamente sin base de datos

### 3. **Configuración de Host Dinámica**
```typescript
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
```
- Resuelve problemas de conectividad en WSL
- Compatible con contenedores Docker

### 4. **Multi-stage Docker Build**
- Optimización de tamaño de imagen
- Cambio de Alpine a Debian cuando se necesita Python/PyTorch
- Usuario no-root para seguridad

## 🔧 **Soluciones a Problemas Comunes**

### 1. **Error: ES Modules en Desarrollo**
**Problema**: `TypeError: Unknown file extension ".ts"`

**Solución**:
- Mantener CommonJS para desarrollo
- TypeScript config: `"module": "CommonJS"`
- No usar `"type": "module"` en package.json
- Vite maneja ES modules automáticamente para frontend

### 2. **PyTorch no disponible en Alpine Linux**
**Problema**: `No matching distribution found for torch`

**Solución**:
```dockerfile
# Cambiar de Alpine a Debian
FROM node:22-bullseye-slim AS production
```

### 3. **JSX no reconocido en build**
**Problema**: `Cannot use JSX unless the '--jsx' flag is provided`

**Solución en tsconfig.json**:
```json
{
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
```

### 4. **Puerto 3000 en uso durante desarrollo**
**Problema**: `EADDRINUSE: address already in use`

**Solución**:
- Matar procesos huérfanos antes de iniciar
- Usar diferentes puertos para frontend (5173) y backend (3000)

## 📝 **Configuraciones Clave**

### TypeScript (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "exclude": ["src/frontend"]
}
```

### Vite (vite.config.ts)
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000', // No localhost en WSL
        changeOrigin: true
      }
    }
  }
});
```

### Estructura de Directorios
```
proyecto/
├── datos_ejemplo/    # Imágenes de ejemplo (no "images")
├── modelo/           # Modelo ML Python
├── public/           # Assets estáticos (logo, favicon)
├── uploads/          # Archivos subidos por usuarios
├── data/             # Estadísticas persistentes
└── src/
    ├── backend/
    └── frontend/
```

## 🚀 **Proceso de Despliegue Exitoso**

1. **Desarrollo Local**
   - `npm run dev` ejecuta backend y frontend concurrentemente
   - Backend en 127.0.0.1:3000
   - Frontend en localhost:5173+

2. **Build de Producción**
   - `npm run build` compila TypeScript y Vite
   - Backend compilado a CommonJS en dist/backend
   - Frontend optimizado en dist/frontend

3. **Docker Build**
   - Multi-stage build reduce tamaño
   - Instala dependencias del sistema según necesidad
   - Copia solo archivos necesarios

4. **Despliegue en Coolify**
   - Detecta Dockerfile automáticamente
   - Configura volumen persistente para /app/data
   - Health check en /api/health
   - Variables de entorno desde UI de Coolify

## 💡 **Recomendaciones para Futuros Proyectos**

### 1. **Inicio del Proyecto**
- Copiar estructura base de este proyecto
- Mantener configuración TypeScript/Vite probada
- No experimentar con ES modules en backend

### 2. **Modelos ML/Python**
- Usar Debian en Docker, no Alpine
- Instalar dependencias Python en Dockerfile
- Ejecutar scripts Python con child_process

### 3. **Estadísticas y Persistencia**
- Implementar desde el inicio
- Usar patrón singleton
- Planificar estructura de datos extensible

### 4. **Assets y Recursos**
- Logo en /public/logo-compacto.png
- Favicon en /public/favicon.ico
- Datos de ejemplo en carpeta descriptiva

### 5. **Variables de Entorno**
- Nunca hardcodear URLs o configuraciones
- Usar defaults sensibles para desarrollo
- Documentar todas las variables necesarias

## 🐛 **Errores Comunes a Evitar**

1. **No mezclar ES modules y CommonJS** en backend
2. **No usar localhost en WSL**, usar 127.0.0.1
3. **No olvidar el health check** para Coolify
4. **No usar Alpine Linux** si necesitas Python/ML
5. **No olvidar usuario no-root** en Dockerfile

## 📋 **Checklist Pre-Despliegue**

- [ ] `npm run dev` funciona sin errores
- [ ] `npm run build` compila exitosamente
- [ ] Health check responde en /api/health
- [ ] Estadísticas persisten en ./data localmente
- [ ] Logo y favicon en /public
- [ ] Dockerfile tiene usuario no-root
- [ ] Variables de entorno documentadas
- [ ] Puerto binding correcto (127.0.0.1 dev, 0.0.0.0 prod)

---

**📅 Documentado:** Agosto 2025  
**🚀 Proyecto:** ECG Classifier  
**✅ Estado:** Desplegado exitosamente en Coolify
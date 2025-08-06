# Implementación de Subida de Archivos

## ✅ Funcionalidades Implementadas

### 1. Soporte Multimodal Completo
- ✅ **Subida de imágenes**: JPG, PNG, GIF, WebP
- ✅ **Subida de PDFs** con extracción de texto
- ✅ **Detección automática** de capacidades por modelo
- ✅ **Manejo inteligente**: Si un modelo no soporta archivos, solo el otro los procesa
- ✅ **Validación de archivos**: Tipo, tamaño y formato

### 2. Arquitectura de Backend
- ✅ **Multer** para manejo de archivos
- ✅ **Sharp** para procesamiento de imágenes
- ✅ **PDF-parse** para extracción de texto de PDFs
- ✅ **File-type** para detección segura de tipos
- ✅ **Cleanup automático** de archivos temporales
- ✅ **Configuración flexible** para local y producción (Coolify/DigitalOcean)

### 3. Capacidades por Modelo

#### OpenAI Models
- **GPT-4O Mini**: ✅ Imágenes (hasta 20MB), ❌ PDFs
- **GPT-3.5 Turbo**: ❌ Imágenes, ❌ PDFs

#### Anthropic Models  
- **Claude 3.5 Haiku**: ✅ Imágenes (hasta 5MB), ✅ PDFs (hasta 10MB)
- **Claude 3.5 Sonnet**: ✅ Imágenes (hasta 5MB), ✅ PDFs (hasta 10MB)

### 4. UI/UX Inteligente
- ✅ **Drag & Drop** de archivos
- ✅ **Vista previa** de imágenes y PDFs
- ✅ **Validación en tiempo real** del tamaño y formato
- ✅ **Indicadores visuales** cuando hay archivos adjuntos
- ✅ **Botón compacto** para mostrar/ocultar área de subida
- ✅ **Mensajes de advertencia** cuando modelos no soportan archivos

## 📂 Archivos Creados/Modificados

### Backend
- `src/backend/config/model-capabilities.ts` - Configuración de capacidades
- `src/backend/services/file-upload.service.ts` - Procesamiento de archivos
- `src/backend/middleware/upload.middleware.ts` - Middleware de Multer
- `src/backend/routes/upload.routes.ts` - Rutas de upload
- `src/backend/controllers/llm.controller.ts` - Manejo de archivos en LLM
- `src/backend/types/index.ts` - Tipos para archivos

### Frontend  
- `src/frontend/components/FileUpload.tsx` - Componente de subida
- `src/frontend/components/PromptInput.tsx` - Integración con prompt
- `src/frontend/services/file.api.ts` - API de archivos
- `src/frontend/styles/file-upload.css` - Estilos del componente
- `src/frontend/App.tsx` - Integración principal

### Testing
- `test-file-upload.html` - Página completa de pruebas

## 🛠️ Configuración de Entorno

### Variables de Entorno
```env
# Directorio de uploads (opcional, default: ./uploads)
UPLOAD_DIR=/path/to/uploads

# Para producción en Coolify/DigitalOcean
UPLOAD_DIR=/app/uploads
```

### Directorios Automáticos
- **Desarrollo**: `./uploads/`
- **Producción**: `/app/uploads/` o valor de `UPLOAD_DIR`
- **Cleanup**: Automático cada hora, archivos > 1 hora se eliminan

## 🔧 API Endpoints

### Upload Endpoints
- `POST /api/upload/upload` - Subir archivos (hasta 5 archivos, 20MB c/u)
- `GET /api/upload/file/:id` - Obtener datos de archivo
- `DELETE /api/upload/file/:id` - Eliminar archivo  
- `POST /api/upload/check-capabilities` - Verificar capacidades de modelo

### LLM Endpoints (actualizados)
- `POST /api/llm/generate` - Ahora acepta `fileIds: string[]`
- `POST /api/llm/stream` - Ahora acepta `fileIds: string[]`

## 🧪 Flujo de Uso

### 1. Usuario sube archivo
```javascript
// Frontend
const files = [imageFile, pdfFile];
const uploadResponse = await fileAPI.uploadFiles(files);
const fileIds = uploadResponse.data.files.map(f => f.id);
```

### 2. Sistema procesa capacidades
```javascript
// Backend
const openaiSupport = canProcessFile('gpt-4o-mini-2024-07-18', 'jpeg', fileSize);
const anthropicSupport = canProcessFile('claude-3-5-haiku-latest', 'jpeg', fileSize);
```

### 3. Llamada inteligente a LLMs
```javascript
// Si OpenAI no soporta PDFs pero Anthropic sí:
// - OpenAI recibe solo el prompt
// - Anthropic recibe prompt + PDF procesado
// - Usuario ve advertencia: "GPT-4O Mini no soporta análisis de PDFs"
```

### 4. Respuesta con metadata
```json
{
  "success": true,
  "data": {
    "openai": {
      "response": "No puedo analizar PDFs, pero puedo ayudarte con...",
      "filesProcessed": false,
      "fileWarnings": ["gpt-4o-mini-2024-07-18: El modelo no soporta análisis de PDFs"]
    },
    "anthropic": {
      "response": "Según el PDF analizado, el documento contiene...",
      "filesProcessed": true
    }
  }
}
```

## 🔒 Seguridad

- ✅ **Validación de tipos** con `file-type` (no confía en extensiones)
- ✅ **Límites estrictos** de tamaño y cantidad
- ✅ **Sanitización automática** de nombres de archivo
- ✅ **Cleanup temporal** para evitar acumulación
- ✅ **Base64 encoding** seguro para transmisión
- ✅ **No persistent storage** por defecto (temporal)

## 🚀 Producción (Coolify/DigitalOcean)

### Configuración Recomendada
```dockerfile
# En Dockerfile
RUN mkdir -p /app/uploads
VOLUME ["/app/uploads"]
ENV UPLOAD_DIR=/app/uploads
```

### Variables de Entorno
```env
NODE_ENV=production
UPLOAD_DIR=/app/uploads
```

### Consideraciones
- Los archivos se almacenan temporalmente (1 hora max)
- Para persistencia, configurar volumen externo
- Sharp funciona correctamente en containers Linux
- PDF-parse no requiere dependencias externas

## 📊 Límites y Restricciones

### Por Modelo
| Modelo | Imágenes | PDFs | Tamaño Img | Tamaño PDF |
|--------|----------|------|------------|------------|
| GPT-4O Mini | ✅ | ❌ | 20MB | - |
| GPT-3.5 Turbo | ❌ | ❌ | - | - |
| Claude 3.5 Haiku | ✅ | ✅ | 5MB | 10MB |
| Claude 3.5 Sonnet | ✅ | ✅ | 5MB | 10MB |

### Sistema General
- **Máximo 5 archivos** por solicitud
- **20MB máximo** por archivo individual
- **Formatos soportados**: JPEG, PNG, GIF, WebP, PDF
- **Cleanup automático**: 10 minutos por archivo, 1 hora global

## 🧪 Testing

### Página de Pruebas
- Abre `test-file-upload.html` en navegador
- Sube imágenes y PDFs de prueba
- Testa capacidades de modelos
- Prueba streaming con archivos adjuntos

### Tests Manuales Recomendados
1. **Imagen JPG** con GPT-4O Mini ✅
2. **Imagen PNG** con Claude Haiku ✅  
3. **PDF** con GPT-4O Mini ❌ (debe mostrar advertencia)
4. **PDF** con Claude Haiku ✅
5. **Archivo muy grande** ❌ (debe rechazar)
6. **Formato no soportado** ❌ (debe rechazar)

---

**Estado**: ✅ **COMPLETADO** - Sistema completo de archivos multimodal implementado
**Compatibilidad**: Local + Coolify + DigitalOcean
**Seguridad**: Validación completa + Cleanup automático
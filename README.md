# Comparador de LLM - Dual Response

Aplicación web para comparar respuestas de diferentes modelos de lenguaje (OpenAI y Anthropic) en tiempo real.

## Características

- 🤖 Comparación simultánea de respuestas de OpenAI y Anthropic
- 🎛️ Selección dinámica de modelos para cada proveedor
- 🌡️ Control de temperatura ajustable (creatividad vs determinismo)
- 📊 Contador de prompts generados persistente
- 🎨 Interfaz moderna y responsiva en español
- 🐳 Docker-ready para deployment en Coolify

## Modelos Disponibles

### OpenAI
- gpt-4o-mini-2024-07-18
- gpt-3.5-turbo-0125

### Anthropic
- claude-3-5-haiku-latest
- claude-3-5-sonnet-20240620

## Instalación

### Requisitos Previos
- Node.js 18 o superior
- npm o yarn
- API Keys de OpenAI y Anthropic

### Configuración

1. Clona el repositorio:
```bash
cd dual-llm-app
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
```

Edita el archivo `.env` y agrega tus API keys:
```env
OPENAI_API_KEY=tu-api-key-de-openai
ANTHROPIC_API_KEY=tu-api-key-de-anthropic
```

### Desarrollo

Ejecuta la aplicación en modo desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

### Producción

1. Construye la aplicación:
```bash
npm run build
```

2. Ejecuta el servidor:
```bash
npm start
```

## Docker

### Construcción de la imagen:
```bash
docker build -t dual-llm-app .
```

### Ejecución del contenedor:
```bash
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=tu-api-key \
  -e ANTHROPIC_API_KEY=tu-api-key \
  -v dual-llm-data:/app/data \
  dual-llm-app
```

## Deployment en Coolify

1. Conecta tu repositorio con Coolify
2. Configura las siguientes variables de entorno:
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`
3. Agrega un volumen persistente:
   - Source: `dual-llm-data`
   - Destination: `/app/data`
4. Deploy automático con cada push a main

## API Endpoints

- `POST /api/llm/generate` - Genera respuestas de ambos LLM
- `GET /api/llm/models` - Obtiene modelos disponibles
- `GET /api/statistics` - Obtiene estadísticas de uso
- `GET /api/health` - Health check del servidor

## Estructura del Proyecto

```
dual-llm-app/
├── src/
│   ├── backend/        # Servidor Express + TypeScript
│   └── frontend/       # React + Vite
├── public/             # Assets estáticos
├── docs/               # Documentación
├── data/               # Datos persistentes
└── dist/               # Build de producción
```

## Scripts Disponibles

- `npm run dev` - Desarrollo (frontend + backend)
- `npm run build` - Construir para producción
- `npm start` - Ejecutar en producción
- `npm run lint` - Linting del código
- `npm run typecheck` - Verificación de tipos

## Autor

**Alejandro Mauro** - Agosto 2025

## Licencia

MIT
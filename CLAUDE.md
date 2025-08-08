# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Multi-Provider LLM Comparison Application - a web app that allows simultaneous comparison of responses from different LLM providers (OpenAI, Anthropic, Google Gemini, and Grok). The application features real-time streaming, file upload support with multimodal capabilities, and response statistics tracking.

## Key Commands

### Development
```bash
npm run dev          # Start both frontend (Vite) and backend (Express) concurrently
npm run dev:backend  # Start only backend with nodemon (port 3000)
npm run dev:frontend # Start only frontend with Vite (port 5173)
```

### Build & Production
```bash
npm run build        # Build both frontend and backend for production
npm run build:frontend  # Build React frontend with Vite
npm run build:backend   # Compile TypeScript backend
npm start            # Run production server from dist/
```

### Code Quality
```bash
npm run lint         # ESLint check for .ts and .tsx files
npm run typecheck    # TypeScript type checking without emit
npm test            # Run Jest tests (if configured)
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express + TypeScript + Node.js
- **Styling**: CSS modules with custom markdown renderer
- **State**: React hooks (useState, custom hooks)
- **API Communication**: Fetch API with SSE (Server-Sent Events) for streaming

### Core Architecture Patterns

1. **Service Layer Pattern**: Each LLM provider has its own service class in `src/backend/services/`:
   - `openai.service.ts` - OpenAI GPT models
   - `anthropic.service.ts` - Claude models
   - `gemini.service.ts` - Google Gemini models
   - `grok.service.ts` - Grok models
   - All services implement streaming responses via SSE

2. **Controller-Route Separation**: 
   - Routes defined in `src/backend/routes/` handle HTTP routing
   - Controllers in `src/backend/controllers/` contain business logic
   - Clear separation of concerns between routing and logic

3. **Multimodal File Processing**:
   - `file-upload.service.ts` handles file uploads with multer
   - Supports images (JPEG, PNG, WebP) and PDFs
   - Model capabilities configuration in `src/backend/config/model-capabilities.ts`
   - Automatic model selection based on file types

4. **Streaming Response Architecture**:
   - Uses Server-Sent Events (SSE) for real-time streaming
   - `stream-helper.ts` provides utilities for SSE formatting
   - Frontend consumes streams via EventSource API
   - Supports cancellation via AbortController

5. **Persistent Statistics**:
   - Statistics stored in `data/statistics.json`
   - Singleton pattern for `StatisticsService`
   - Tracks prompt count persistently across restarts

### Key Components

**Backend Structure**:
- `server.ts` - Express server setup with middleware configuration
- `controllers/llm.controller.ts` - Main controller handling LLM requests
- `services/` - Provider-specific implementations and utilities
- `middleware/upload.middleware.ts` - Multer configuration for file uploads
- `types/index.ts` - Shared TypeScript types

**Frontend Structure**:
- `App.tsx` - Main component with state management
- `components/LLMResponseBox.tsx` - Displays streaming LLM responses
- `components/MarkdownRenderer.tsx` - Rich markdown rendering with math support
- `components/FileUpload.tsx` - Drag-and-drop file upload interface
- `hooks/useModels.ts` - Custom hook for model management
- `services/api.ts` - API client with streaming support

### Environment Variables

Required in `.env`:
```
OPENAI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key
GEMINI_API_KEY=your-key  # Optional
GROK_API_KEY=your-key     # Optional
PORT=3000                 # Optional, defaults to 3000
NODE_ENV=production       # Set for production builds
```

### Docker Deployment

The application is Docker-ready with multi-stage build:
- Development dependencies excluded from production image
- Volume mount at `/app/data` for persistent statistics
- Runs on port 3000 in production mode

### API Endpoints

- `POST /api/llm/stream` - Stream LLM responses with SSE
- `POST /api/llm/generate` - Generate responses (deprecated, use stream)
- `GET /api/llm/models` - Get available models for all providers
- `GET /api/statistics` - Get usage statistics
- `POST /api/upload/upload` - Upload files for multimodal processing
- `GET /api/upload/file/:id` - Retrieve uploaded file
- `GET /api/health` - Health check endpoint

### Testing Approach

While no active tests exist, the project is configured for Jest. Test files should be placed alongside source files with `.test.ts` or `.spec.ts` extensions.

### Important Implementation Details

1. **Model Capabilities**: Different models support different file types. The system automatically selects the best model based on uploaded files (see `model-capabilities.ts`).

2. **Streaming Cancellation**: Users can cancel ongoing streams. The frontend uses AbortController, and the backend properly handles connection cleanup.

3. **File Processing**: Files are processed based on type:
   - Images: Converted to base64 for multimodal models
   - PDFs: Text extracted with pdf-parse, pages as images for vision models
   - Size limits: 10MB per file, 5 files maximum

4. **Error Handling**: Each service has try-catch blocks with detailed error messages. Streaming errors are sent as SSE error events.

5. **CORS & Security**: Helmet.js for security headers, CORS enabled for development. Production serves frontend from Express.
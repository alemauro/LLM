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
FROM node:22-alpine AS production
WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache curl

# Instalar solo dependencias de producción
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar builds compilados
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Crear estructura de directorios para datos persistentes
RUN mkdir -p data && \
    chown -R node:node /app data

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
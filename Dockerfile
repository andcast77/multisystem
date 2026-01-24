# =========================
# Stage 1: Dependencies
# =========================
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Verificar y copiar archivos de dependencias
COPY package.json ./
RUN if [ ! -f package.json ]; then \
      echo "ERROR: package.json no encontrado" && exit 1; \
    fi

COPY pnpm-lock.yaml* pnpm-workspace.yaml* package-lock.json* ./

# Instalar dependencias con verificación
RUN echo "Instalando dependencias..." && \
    if [ -f pnpm-lock.yaml ]; then \
      echo "Usando pnpm con lockfile..." && \
      pnpm install --frozen-lockfile || (echo "ERROR: Fallo en pnpm install" && exit 1); \
    else \
      echo "Usando npm..." && \
      npm ci || npm install || (echo "ERROR: Fallo en npm install" && exit 1); \
    fi && \
    echo "Dependencias instaladas correctamente"

# =========================
# Stage 2: Build (Producción)
# =========================
FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN if [ -f pnpm-lock.yaml ]; then \
      pnpm build; \
    else \
      npm run build; \
    fi

# =========================
# Stage 3: Runtime (Producción)
# =========================
FROM node:20-alpine AS runtime
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Usuario no root
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copiar standalone output (optimizado para Next.js standalone)
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]

# =========================
# Stage 4: Development
# =========================
FROM node:20-alpine AS dev
RUN apk add --no-cache libc6-compat wget curl
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Verificar y copiar archivos de dependencias
COPY package.json ./
RUN if [ ! -f package.json ]; then \
      echo "ERROR: package.json no encontrado" && exit 1; \
    fi

COPY pnpm-lock.yaml* pnpm-workspace.yaml* package-lock.json* ./

# Instalar dependencias (incluyendo devDependencies) con verificación
RUN echo "Instalando dependencias de desarrollo..." && \
    if [ -f pnpm-lock.yaml ]; then \
      echo "Usando pnpm..." && \
      pnpm install --shamefully-hoist || (echo "ERROR: Fallo en pnpm install" && exit 1); \
    else \
      echo "Usando npm..." && \
      npm install || (echo "ERROR: Fallo en npm install" && exit 1); \
    fi && \
    echo "Verificando instalación de dependencias críticas..." && \
    if [ -f pnpm-lock.yaml ]; then \
      pnpm list next react react-dom typescript 2>/dev/null || echo "ADVERTENCIA: Verificar dependencias"; \
      if ! pnpm list next >/dev/null 2>&1; then \
        echo "ERROR: Next.js no está instalado correctamente" && exit 1; \
      fi; \
    else \
      npm list next react react-dom typescript 2>/dev/null || echo "ADVERTENCIA: Verificar dependencias"; \
      if ! npm list next >/dev/null 2>&1; then \
        echo "ERROR: Next.js no está instalado correctamente" && exit 1; \
      fi; \
    fi && \
    echo "Dependencias de desarrollo instaladas correctamente"

# Copiar el resto de los archivos
COPY . .

# Configurar permisos para volúmenes
RUN chown -R node:node /app || true

# Variables de entorno para desarrollo
ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1
ENV WATCHPACK_POLLING=true
ENV CHOKIDAR_USEPOLLING=true

EXPOSE 3000

# Script de inicio con verificación
CMD ["sh", "-c", "echo 'Iniciando servidor de desarrollo Hub...' && pnpm dev"]

# =========================
# Stage 5: Development con Nginx
# =========================
FROM dev AS dev-with-nginx

# Instalar Nginx
RUN apk add --no-cache nginx

# Crear directorios necesarios
RUN mkdir -p /var/log/nginx /var/cache/nginx /run/nginx

# Copiar configuración de Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Exponer puerto 80 para Nginx
EXPOSE 80

# Health check que verifica tanto Next.js como Nginx
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health && \
      wget --no-verbose --tries=1 --spider http://localhost:3000/api/health

# Script de inicio que ejecuta tanto Nginx como Next.js
CMD ["sh", "-c", "nginx && echo 'Nginx iniciado' && sleep 2 && echo 'Iniciando servidor de desarrollo Hub...' && pnpm dev"]

# =========================
# Stage 6: Runtime con Nginx (Producción)
# =========================
FROM node:20-alpine AS runtime-with-nginx
RUN apk add --no-cache nginx wget curl
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Usuario no root para Next.js
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copiar standalone output (optimizado para Next.js standalone)
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

# Crear directorios necesarios para Nginx
RUN mkdir -p /var/log/nginx /var/cache/nginx /run/nginx

# Copiar configuración de Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Configurar permisos para Nginx (necesita ejecutarse como root)
RUN chmod 755 /var/log/nginx /var/cache/nginx /run/nginx

# Exponer puertos
EXPOSE 80
EXPOSE 3000

# Health check que verifica tanto Nginx como Next.js
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health && \
      wget --no-verbose --tries=1 --spider http://localhost:3000/

# Script de inicio que ejecuta tanto Nginx (como root) como Next.js (como nextjs)
# Nginx debe ejecutarse como root, pero Next.js como nextjs
# Nota: El contenedor corre como root para permitir que Nginx inicie, pero Next.js se ejecuta como nextjs
CMD ["sh", "-c", "nginx && sleep 2 && echo 'Nginx iniciado' && exec su nextjs -s /bin/sh -c 'cd /app && node server.js'"]
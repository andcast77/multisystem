# Thin Next.js Dockerfile — build from monorepo root.
ARG NODE_VERSION=20-alpine
ARG PNPM_FILTER=@multisystem/hub
ARG APP_DIR=hub
ARG PORT=3001

FROM node:${NODE_VERSION} AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/*/package.json ./apps/
COPY packages/*/package.json ./packages/
RUN pnpm fetch

FROM deps AS builder
ARG PNPM_FILTER
COPY . .
RUN pnpm install --offline
RUN pnpm --filter "${PNPM_FILTER}"... build

FROM base AS runner
ARG APP_DIR
ARG PORT
ENV PORT=${PORT}
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_DIR}/.next ./apps/${APP_DIR}/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_DIR}/public ./apps/${APP_DIR}/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_DIR}/package.json ./apps/${APP_DIR}/package.json
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_DIR}/next.config.ts ./apps/${APP_DIR}/next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
WORKDIR /app/apps/${APP_DIR}
USER nextjs
EXPOSE ${PORT}
CMD ["sh", "-c", "next start -p $PORT"]

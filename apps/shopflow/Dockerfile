# Thin Next.js Dockerfile — build from monorepo root.
ARG NODE_VERSION=20-alpine

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/*/package.json ./apps/
COPY packages/*/package.json ./packages/
RUN pnpm fetch

FROM deps AS builder
COPY . .
RUN pnpm install --offline
RUN pnpm --filter @multisystem/shopflow... build

FROM base AS runner
ENV PORT=3002
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/apps/shopflow/.next ./apps/shopflow/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/shopflow/public ./apps/shopflow/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/shopflow/package.json ./apps/shopflow/package.json
COPY --from=builder --chown=nextjs:nodejs /app/apps/shopflow/next.config.ts ./apps/shopflow/next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
WORKDIR /app/apps/shopflow
USER nextjs
EXPOSE 3002
CMD ["sh", "-c", "next start -p $PORT"]

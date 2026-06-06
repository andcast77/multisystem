# Thin Next.js Dockerfile — build from monorepo root.
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
RUN pnpm --filter @multisystem/workify... build

FROM base AS runner
ENV PORT=3003
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/apps/workify/.next ./apps/workify/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/workify/public ./apps/workify/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/workify/package.json ./apps/workify/package.json
COPY --from=builder --chown=nextjs:nodejs /app/apps/workify/next.config.ts ./apps/workify/next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
WORKDIR /app/apps/workify
USER nextjs
EXPOSE 3003
CMD ["sh", "-c", "next start -p $PORT"]

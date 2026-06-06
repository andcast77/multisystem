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
RUN pnpm --filter @multisystem/balance... build

FROM base AS runner
ENV PORT=3005
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/apps/balance/.next ./apps/balance/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/balance/public ./apps/balance/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/balance/package.json ./apps/balance/package.json
COPY --from=builder --chown=nextjs:nodejs /app/apps/balance/next.config.ts ./apps/balance/next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
WORKDIR /app/apps/balance
USER nextjs
EXPOSE 3005
CMD ["sh", "-c", "next start -p $PORT"]

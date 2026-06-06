# @multisystem/baro — thin Next.js image (no local Prisma).
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
RUN pnpm --filter @multisystem/baro... build

FROM base AS runner
ENV PORT=3006
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/apps/baro/.next ./apps/baro/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/baro/public ./apps/baro/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/baro/package.json ./apps/baro/package.json
COPY --from=builder --chown=nextjs:nodejs /app/apps/baro/next.config.ts ./apps/baro/next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY apps/baro/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
WORKDIR /app/apps/baro
USER nextjs
EXPOSE 3006
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["sh", "-c", "next start -p $PORT"]

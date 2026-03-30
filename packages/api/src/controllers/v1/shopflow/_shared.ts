import type { FastifyRequest, FastifyReply } from 'fastify'
import { requireAuth } from '../../../core/auth.js'
import { requireShopflowContext } from '../../../core/auth-context.js'
import { contextFromRequest } from '../../../core/auth-context.js'
import { requireModuleAccess } from '../../../core/modules.js'

export function getCtx(request: FastifyRequest, requireShopflow = true): ReturnType<typeof contextFromRequest> {
  return requireShopflow ? contextFromRequest(request, true) : contextFromRequest(request, false)
}

export function handle<T extends (req: any, rep: any) => any>(
  handler: T
): (req: FastifyRequest, rep: FastifyReply) => ReturnType<T> {
  return (req, rep) => handler(req as Parameters<T>[0], rep as Parameters<T>[1])
}

export const pre = [requireAuth, requireShopflowContext, requireModuleAccess('shopflow')]

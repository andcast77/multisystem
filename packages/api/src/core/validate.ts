import { FastifyReply } from 'fastify'
import { z } from 'zod'
import { BadRequestError } from '../common/errors/app-error.js'

function formatZodError(err: z.ZodError): string {
  const flat = err.flatten()
  const fieldErrors = flat.fieldErrors as Record<string, string[] | undefined>
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return Object.entries(fieldErrors)
      .map(([k, v]) => (v?.[0] ? `${k}: ${v[0]}` : k))
      .join('; ')
  }
  return err.issues.map((e) => e.message).join('; ')
}

/**
 * @deprecated Use `validateBody` instead. This will be removed once all controllers are migrated.
 */
export function validateOr400<T>(
  reply: FastifyReply,
  schema: z.ZodType<T>,
  value: unknown
): T | null {
  const result = schema.safeParse(value)
  if (result.success) return result.data
  const message = formatZodError(result.error)
  reply.code(400)
  reply.send({ success: false, error: message })
  return null
}

/**
 * Validate input against a Zod schema. Throws BadRequestError on failure.
 * Use in controllers: `const body = validateBody(schema, request.body)`
 */
export function validateBody<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (result.success) return result.data
  throw new BadRequestError(formatZodError(result.error))
}

/**
 * Validate query string against a Zod schema. Throws BadRequestError on failure.
 * Use in controllers: `const query = validateQuery(schema, request.query)`
 */
export const validateQuery = validateBody

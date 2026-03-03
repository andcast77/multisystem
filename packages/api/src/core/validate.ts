import { FastifyReply } from 'fastify'
import { z } from 'zod'

function formatZodError(err: z.ZodError): string {
  const flat = err.flatten()
  const fieldErrors = flat.fieldErrors as Record<string, string[] | undefined>
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return Object.entries(fieldErrors)
      .map(([k, v]) => (v?.[0] ? `${k}: ${v[0]}` : k))
      .join('; ')
  }
  return err.errors.map((e) => e.message).join('; ')
}

/**
 * Validate with Zod schema. On failure sends 400 with error message and returns null.
 * Handler should check: if (body === null) return (reply already sent).
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

/**
 * Shared JSON Schemas for Fastify `response` serialization (see Fastify Recommendations).
 * `data` stays open (`additionalProperties: true`) to avoid huge per-route schemas while
 * still typing the standard envelope.
 */
export const apiOkEnvelope200 = {
  type: 'object',
  required: ['success', 'data'],
  additionalProperties: false,
  properties: {
    success: { type: 'boolean', const: true },
    data: {
      anyOf: [
        { type: 'object', additionalProperties: true },
        { type: 'array' },
      ],
    },
  },
} as const

import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { AppError, ValidationError } from './app-error.js'

/**
 * Global Fastify error handler that maps domain errors to HTTP responses.
 * This is the ONLY place where HTTP status codes should be set based on error type.
 */
export function globalErrorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (error instanceof ValidationError) {
    return reply.code(error.statusCode).send({
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
    })
  }

  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      success: false,
      error: error.message,
      code: error.code,
    })
  }

  // Fastify validation errors (schema validation)
  if ('validation' in error && error.validation) {
    return reply.code(400).send({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.validation,
    })
  }

  // Unexpected errors
  request.log.error(error)
  return reply.code(500).send({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error.message,
  })
}

import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { AppError, CaptchaFailedError, TooManyRequestsError, ValidationError } from './app-error.js'

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
      message: error.message,
      code: error.code,
      details: error.details,
    })
  }

  if (error instanceof TooManyRequestsError && error.retryAfterSeconds != null && error.retryAfterSeconds > 0) {
    reply.header('Retry-After', String(Math.ceil(error.retryAfterSeconds)))
  }

  if (error instanceof CaptchaFailedError) {
    return reply.code(error.statusCode).send({
      success: false,
      error: error.message,
      message: error.message,
      code: error.code,
      ...(error.turnstileErrorCodes?.length ? { turnstileErrorCodes: error.turnstileErrorCodes } : {}),
    })
  }

  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      success: false,
      error: error.message,
      message: error.message,
      code: error.code,
      ...(error instanceof TooManyRequestsError && error.retryAfterSeconds != null
        ? { retryAfterSeconds: Math.ceil(error.retryAfterSeconds) }
        : {}),
    })
  }

  // Fastify validation errors (schema validation)
  if ('validation' in error && error.validation) {
    return reply.code(400).send({
      success: false,
      error: 'Validation failed',
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.validation,
    })
  }

  // Unexpected errors
  request.log.error(error)
  const fallback =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
  return reply.code(500).send({
    success: false,
    error: fallback,
    message: fallback,
  })
}

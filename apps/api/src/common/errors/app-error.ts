/**
 * Domain error hierarchy that replaces direct FastifyReply manipulation in services.
 * Services throw these errors; the global error handler maps them to HTTP responses.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code?: string) {
    super(404, message, code)
    this.name = 'NotFoundError'
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', code?: string) {
    super(400, message, code)
    this.name = 'BadRequestError'
  }
}

/** Turnstile / siteverify falló; `turnstileErrorCodes` expone códigos de Cloudflare para depuración. */
export class CaptchaFailedError extends BadRequestError {
  constructor(
    message = 'Captcha inválido',
    public readonly turnstileErrorCodes?: string[],
  ) {
    super(message, 'CAPTCHA_FAILED')
    this.name = 'CaptchaFailedError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code?: string) {
    super(401, message, code)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code?: string) {
    super(403, message, code)
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', code?: string) {
    super(409, message, code)
    this.name = 'ConflictError'
  }
}

export class ValidationError extends AppError {
  constructor(
    message = 'Validation failed',
    public readonly details?: Record<string, string[]>,
  ) {
    super(422, message, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class TooManyRequestsError extends AppError {
  constructor(
    message = 'Too many requests',
    public readonly retryAfterSeconds?: number,
    code = 'TOO_MANY_REQUESTS',
  ) {
    super(429, message, code)
    this.name = 'TooManyRequestsError'
  }
}

/** OTP / Redis unavailable — client should retry later or contact support. */
export class ServiceUnavailableError extends AppError {
  constructor(message = 'Servicio temporalmente no disponible', code = 'SERVICE_UNAVAILABLE') {
    super(503, message, code)
    this.name = 'ServiceUnavailableError'
  }
}

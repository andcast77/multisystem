import { describe, it, expect } from 'vitest'
import {
  AppError,
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from '../../common/errors/app-error.js'

describe('AppError hierarchy', () => {
  it('creates a base AppError with status code and message', () => {
    const err = new AppError(418, 'I am a teapot', 'TEAPOT')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(AppError)
    expect(err.statusCode).toBe(418)
    expect(err.message).toBe('I am a teapot')
    expect(err.code).toBe('TEAPOT')
    expect(err.name).toBe('AppError')
  })

  it('NotFoundError defaults to 404', () => {
    const err = new NotFoundError()
    expect(err.statusCode).toBe(404)
    expect(err.message).toBe('Resource not found')
    expect(err).toBeInstanceOf(AppError)
  })

  it('NotFoundError accepts custom message', () => {
    const err = new NotFoundError('Venta no encontrada')
    expect(err.statusCode).toBe(404)
    expect(err.message).toBe('Venta no encontrada')
  })

  it('BadRequestError defaults to 400', () => {
    const err = new BadRequestError('Invalid input')
    expect(err.statusCode).toBe(400)
    expect(err.message).toBe('Invalid input')
  })

  it('UnauthorizedError defaults to 401', () => {
    const err = new UnauthorizedError()
    expect(err.statusCode).toBe(401)
    expect(err.message).toBe('Unauthorized')
  })

  it('ForbiddenError defaults to 403', () => {
    const err = new ForbiddenError()
    expect(err.statusCode).toBe(403)
    expect(err.message).toBe('Forbidden')
  })

  it('ConflictError defaults to 409', () => {
    const err = new ConflictError('Duplicate SKU')
    expect(err.statusCode).toBe(409)
    expect(err.message).toBe('Duplicate SKU')
  })

  it('ValidationError has 422 status and details', () => {
    const err = new ValidationError('Validation failed', {
      email: ['Required'],
      name: ['Too short'],
    })
    expect(err.statusCode).toBe(422)
    expect(err.code).toBe('VALIDATION_ERROR')
    expect(err.details).toEqual({
      email: ['Required'],
      name: ['Too short'],
    })
  })
})

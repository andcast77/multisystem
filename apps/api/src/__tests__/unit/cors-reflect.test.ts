import { describe, it, expect } from 'vitest'
import {
  applyCorsHeadersToRawResponse,
  parseCorsOriginList,
  reflectAllowedOrigin,
} from '../../core/cors-reflect.js'

describe('cors-reflect', () => {
  it('parseCorsOriginList splits and trims', () => {
    expect(parseCorsOriginList('http://localhost:3001, http://localhost:3002')).toEqual([
      'http://localhost:3001',
      'http://localhost:3002',
    ])
  })

  it('reflectAllowedOrigin returns the origin when allowed', () => {
    expect(reflectAllowedOrigin('http://localhost:3001', ['http://localhost:3001'])).toBe(
      'http://localhost:3001',
    )
    expect(reflectAllowedOrigin('http://evil.com', ['http://localhost:3001'])).toBeNull()
    expect(reflectAllowedOrigin(undefined, ['http://localhost:3001'])).toBeNull()
  })

  it('applyCorsHeadersToRawResponse sets headers when origin matches', () => {
    const headers: Record<string, string | string[]> = {}
    const raw = {
      setHeader(name: string, value: string) {
        headers[name] = value
      },
    } as import('http').ServerResponse

    applyCorsHeadersToRawResponse(raw, 'http://localhost:3001', ['http://localhost:3001'])

    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:3001')
    expect(headers['Access-Control-Allow-Credentials']).toBe('true')
    expect(headers.Vary).toBe('Origin')
  })

  it('applyCorsHeadersToRawResponse skips when origin not allowed', () => {
    const headers: Record<string, string | string[]> = {}
    const raw = {
      setHeader(name: string, value: string) {
        headers[name] = value
      },
    } as import('http').ServerResponse

    applyCorsHeadersToRawResponse(raw, 'http://evil.com', ['http://localhost:3001'])

    expect(Object.keys(headers).length).toBe(0)
  })
})

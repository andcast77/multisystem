import { describe, it, expect } from 'vitest'
import { summarizeUserAgent } from '../../core/user-agent-summary.js'

describe('summarizeUserAgent', () => {
  it('returns null for empty input', () => {
    expect(summarizeUserAgent(null)).toBeNull()
    expect(summarizeUserAgent('')).toBeNull()
    expect(summarizeUserAgent('   ')).toBeNull()
  })

  it('detects Chrome on Windows', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    expect(summarizeUserAgent(ua)).toContain('Chrome')
    expect(summarizeUserAgent(ua)).toContain('Windows')
  })
})

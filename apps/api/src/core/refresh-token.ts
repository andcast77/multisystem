import { createHash, randomUUID } from 'crypto'

export function hashRefreshToken(plain: string): string {
  return createHash('sha256').update(plain, 'utf8').digest('hex')
}

export function generateRefreshTokenPlain(): string {
  return randomUUID()
}

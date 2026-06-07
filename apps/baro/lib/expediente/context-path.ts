import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** `apps/baro` — module-relative (works in dev and standalone bundle layout). */
const baroAppRoot = path.join(
  /* turbopackIgnore: true */ path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
)

/** Baro `context/` directory (templates, manifests). */
export function baroContextRoot(): string {
  return path.join(baroAppRoot, 'context')
}

export function baroContextPath(...segments: string[]): string {
  return path.join(baroContextRoot(), ...segments)
}

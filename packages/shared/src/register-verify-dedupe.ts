/**
 * Dedupe concurrent / Strict Mode double-mount verify for the same email+token.
 * Successful runs stay cached for the session; failed runs are evicted so the user can retry.
 */
const inflight = new Map<string, Promise<void>>()

export function dedupeRegisterVerifyKey(email: string, token: string): string {
  return `${email.trim().toLowerCase()}\n${token.trim()}`
}

export function runRegisterVerifyDeduped(
  email: string,
  token: string,
  work: () => Promise<void>,
): Promise<void> {
  const k = dedupeRegisterVerifyKey(email, token)
  const existing = inflight.get(k)
  if (existing) return existing

  const p = (async () => {
    try {
      await work()
    } catch (err: unknown) {
      inflight.delete(k)
      throw err
    }
  })()
  inflight.set(k, p)
  return p
}

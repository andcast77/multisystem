'use client'

import Link from 'next/link'
import { useAccount } from '@/components/app/account-context'
import { Button } from '@/components/ui/button'

const HUB_ACCOUNT_URL =
  (process.env.NEXT_PUBLIC_HUB_URL?.replace(/\/$/, '') || 'http://localhost:3001') + '/cuenta'

export function AccountAccessCard() {
  const { user, loading, error, lastMeStatus } = useAccount()

  if (loading && !user) {
    return (
      <section aria-busy="true">
        <p className="text-sm text-[var(--color-muted)]">Cargando…</p>
      </section>
    )
  }

  if (!user) {
    const showLogin = lastMeStatus === 401
    return (
      <section>
        <p className="text-sm text-[var(--color-muted)]">
          {error ?? 'No hay sesión activa. Si ves este mensaje, volvé a iniciar sesión.'}
        </p>
        {showLogin ? (
          <p className="mt-4">
            <Link
              href="/login?from=/cuenta"
              className="inline-flex rounded-full bg-[var(--color-cta)] px-5 py-2.5 text-sm font-semibold text-[var(--color-cta-foreground)] shadow-[var(--shadow-soft)] transition-colors hover:bg-[var(--color-cta-hover)]"
            >
              Ir a iniciar sesión
            </Link>
          </p>
        ) : null}
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-[var(--color-heading)]">Seguridad</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
        La contraseña de tu cuenta se gestiona desde el Hub central. Podés cambiarla allí sin cerrar
        sesión en Baro.
      </p>
      <div className="mt-4">
        <Button asChild variant="outline">
          <a href={HUB_ACCOUNT_URL} target="_blank" rel="noopener noreferrer">
            Cambiar contraseña en Hub
          </a>
        </Button>
      </div>
    </section>
  )
}

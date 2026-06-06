'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/lib/api/client'
import type { ApiResponse, LoginResponse } from '@multisystem/contracts'

type Mode = 'login' | 'register'

const HUB_REGISTER_URL =
  (process.env.NEXT_PUBLIC_HUB_URL?.replace(/\/$/, '') || 'http://localhost:3001') + '/register'

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') ?? '/dashboard'
  const sessionReason = searchParams.get('reason')
  const sessionReasonMessage =
    sessionReason === 'session'
      ? 'Tu sesión expiró o dejó de ser válida. Volvé a ingresar.'
      : sessionReason === 'server'
        ? 'El servidor no pudo validar tu cuenta. Probá de nuevo en unos minutos.'
        : sessionReason === 'account'
          ? 'No pudimos obtener los datos de tu cuenta.'
          : sessionReason === 'network'
            ? 'No pudimos conectar con el servidor para validar la sesión.'
            : null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (mode === 'register') {
    const hubUrl = new URL(HUB_REGISTER_URL)
    searchParams.forEach((value, key) => {
      if (key !== 'from') hubUrl.searchParams.set(key, value)
    })
    return (
      <div className="mt-8 flex flex-col gap-4">
        <p className="text-sm text-[var(--color-muted)]">
          El registro de cuentas se realiza desde el Hub de Multisystem.
        </p>
        <Button asChild className="mt-2 w-full rounded-full">
          <a href={hubUrl.toString()}>Ir al registro en Hub</a>
        </Button>
        <p className="text-center text-sm text-[var(--color-muted)]">
          ¿Ya tenés cuenta?{' '}
          <Link
            href={`/login${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
            className="font-medium text-[var(--color-accent-bright)] underline-offset-4 hover:underline"
          >
            Ingresá
          </Link>
        </p>
      </div>
    )
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      const res = await authApi.post<ApiResponse<LoginResponse>>('/login', { email, password })
      if (!res.success) {
        setError(res.message ?? res.error ?? 'No se pudo completar la solicitud.')
        return
      }

      router.push(from)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la solicitud.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} method="post" className="mt-8 flex flex-col gap-4">
      {sessionReasonMessage ? (
        <p
          className="rounded-lg border border-amber-200/90 bg-amber-50 px-3 py-2.5 text-sm text-amber-950"
          role="status"
        >
          {sessionReasonMessage}
        </p>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="auth-email">Email</Label>
        <Input
          id="auth-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="auth-password">Contraseña</Label>
        <Input
          id="auth-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="mt-2 w-full rounded-full" disabled={pending}>
        {pending ? 'Procesando…' : 'Ingresar'}
      </Button>
      <p className="text-center text-sm text-[var(--color-muted)]">
        ¿No tenés cuenta?{' '}
        <Link
          href={`/register${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
          className="font-medium text-[var(--color-accent-bright)] underline-offset-4 hover:underline"
        >
          Registrate
        </Link>
      </p>
    </form>
  )
}

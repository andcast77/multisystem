'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { authApi } from '@/lib/api/client'
import { Button } from '@multisystem/ui'
import { Input } from '@multisystem/ui'
import { Label } from '@multisystem/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@multisystem/ui'

type CompanyOption = { id: string; name: string; workifyEnabled: boolean; shopflowEnabled: boolean }

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 días
const TOKEN_COOKIE_NAME = 'token'

function setTokenCookie(token: string) {
  document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [rawName, ...rest] = cookie.trim().split('=')
    if (rawName === TOKEN_COOKIE_NAME) {
      try {
        return decodeURIComponent(rest.join('='))
      } catch {
        return null
      }
    }
  }
  return null
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(() => Boolean(getTokenFromCookie()))
  const [companies, setCompanies] = useState<CompanyOption[] | null>(null)
  const [selectingCompany, setSelectingCompany] = useState(false)

  // Verificar si el usuario ya está autenticado (solo vía API)
  useEffect(() => {
    let isActive = true
    const token = getTokenFromCookie()

    if (!token) {
      setIsCheckingAuth(false)
      return
    }

    const checkAuth = async () => {
      try {
        await authApi.get('/me')
        window.location.href = '/dashboard'
        return
      } catch {
        // Si la API falla, mostrar el formulario
      } finally {
        if (isActive) {
          setIsCheckingAuth(false)
        }
      }
    }

    checkAuth()

    return () => {
      isActive = false
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await authApi.post<
        | {
            success: true
            data: {
              token: string
              user: { id: string; email: string; role: string; name: string }
              companyId?: string
              company?: { id: string; name: string }
              companies?: CompanyOption[]
            }
          }
        | { success: false; error?: string }
      >('/login', data)

      if (!res || typeof res !== 'object' || !('data' in res) || !res.success || !res.data) {
        setError((res as { error?: string })?.error ?? 'Error al iniciar sesión')
        return
      }

      const { token, companyId, company, companies: companiesList } = res.data

      if (!token) {
        setError('La API no devolvió un token')
        return
      }

      setTokenCookie(token)

      // Si ya hay empresa en el token, ir al dashboard
      if (companyId ?? company) {
        window.location.href = '/dashboard'
        return
      }

      // Superuser o varias empresas: seleccionar primera por defecto y redirigir
      if (companiesList && companiesList.length > 0) {
        const withShopflow = companiesList.filter((c) => c.shopflowEnabled)
        const listToShow = withShopflow.length > 0 ? withShopflow : companiesList
        if (listToShow.length > 0) {
          const ctx = await authApi.post<{ success: boolean; data?: { token: string }; error?: string }>(
            '/context',
            { companyId: listToShow[0].id }
          )
          if (ctx && typeof ctx === 'object' && 'data' in ctx && ctx.success && ctx.data?.token) {
            setTokenCookie(ctx.data.token)
            window.location.href = '/dashboard'
            return
          }
        }
        setCompanies(listToShow)
        setSelectingCompany(true)
        return
      }

      window.location.href = '/dashboard'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChooseCompany = async (companyId: string) => {
    setError(null)
    setIsLoading(true)
    try {
      const res = await authApi.post<{ success: boolean; data?: { token: string }; error?: string }>(
        '/context',
        { companyId }
      )
      if (!res || typeof res !== 'object' || !('data' in res) || !res.success || !res.data?.token) {
        setError((res as { error?: string })?.error ?? 'Error al seleccionar empresa')
        return
      }
      setTokenCookie(res.data.token)
      window.location.href = '/dashboard'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al seleccionar empresa')
    } finally {
      setIsLoading(false)
    }
  }

  // Mostrar loading mientras se verifica la autenticación
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.16),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.16),_transparent_45%)] bg-slate-50 px-4">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Verificando autenticación...</p>
          </div>
        </div>
      </div>
    )
  }

  // Pantalla de selección de empresa (superuser o varias empresas)
  if (selectingCompany && companies && companies.length > 0) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.16),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.16),_transparent_45%)] bg-slate-50 px-4">
        <div className="flex min-h-screen items-center justify-center">
          <Card className="w-full max-w-md border-white/60 bg-white/85 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Selecciona una empresa
            </CardTitle>
            <CardDescription className="text-center">
              Elige con qué empresa quieres trabajar en ShopFlow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              {companies.map((c) => (
                <Button
                  key={c.id}
                  type="button"
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                  disabled={isLoading}
                  onClick={() => handleChooseCompany(c.id)}
                >
                  {c.name}
                </Button>
              ))}
            </div>
          </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.16),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.16),_transparent_45%)] bg-slate-50">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center gap-3">
              <Link href="/">
                <Image
                  src="/logo/logo-completo/shopflow-logo-horizontal.png"
                  alt="ShopFlow POS"
                  width={200}
                  height={50}
                />
              </Link>
            </div>
            <Card className="border-white/60 bg-white/85 shadow-2xl backdrop-blur">
              <CardHeader className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs text-indigo-700 shadow-sm">
                  <Sparkles className="h-4 w-4" />
                  Hola de nuevo
                </div>
                <CardTitle className="text-2xl font-bold">Bienvenido a ShopFlow</CardTitle>
                <CardDescription>
                  Inicia sesión para continuar con tu operación.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6">
                {/* Formulario seguro: usa POST con body JSON, nunca GET con query params */}
                <form onSubmit={handleSubmit(onSubmit)} method="post" className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      {...register('email')}
                      disabled={isLoading}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      {...register('password')}
                      disabled={isLoading}
                      className={errors.password ? 'border-red-500' : ''}
                    />
                    {errors.password && (
                      <p className="text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-500 hover:to-blue-500"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                </form>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                  <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
                    Volver al inicio
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/register" className="text-indigo-600 hover:underline">
                    Crear una cuenta nueva
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <aside className="relative hidden lg:block overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600" />
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -top-40 left-20 h-[520px] w-[520px] rounded-full border border-white/30" />
            <div className="absolute -top-20 left-44 h-[520px] w-[520px] rounded-full border border-white/20" />
            <div className="absolute top-6 left-72 h-[520px] w-[520px] rounded-full border border-white/10" />
          </div>
          <div className="absolute inset-0">
            <div className="absolute -top-16 right-16 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-16 left-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          </div>
          <div className="relative flex h-full flex-col justify-between p-14 text-white">
            <div className="text-sm uppercase tracking-[0.35em] text-white/80">ShopFlow POS</div>
            <div>
              <h2 className="text-4xl font-semibold leading-tight">
                Hola,
                <span className="block text-white/90">vuelve a tu punto de venta.</span>
              </h2>
              <p className="mt-4 text-base text-white/80">
                Automatiza tareas repetitivas, vende más rápido y mantén el control sin complicarte.
              </p>
            </div>
            <div className="rounded-2xl border border-white/25 bg-white/10 p-4 text-sm text-white/85">
              “Menos pantallas, más ventas. Todo lo esencial en un solo lugar.”
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

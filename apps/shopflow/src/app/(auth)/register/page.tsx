'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'
import { authApi } from '@/lib/api/client'
import { Button } from '@multisystem/ui'
import { Input } from '@multisystem/ui'
import { Label } from '@multisystem/ui'
import { Checkbox } from '@multisystem/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@multisystem/ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@multisystem/ui'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 días
const TOKEN_COOKIE_NAME = 'token'

function setTokenCookie(token: string) {
  document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await authApi.post<
        | {
            success: true
            data: {
              token: string
              user: { id: string; email: string; role: string; name: string; companyId?: string }
              company?: { id: string; name: string; workifyEnabled: boolean; shopflowEnabled: boolean }
            }
          }
        | { success: false; error?: string }
      >('/register', {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName,
        shopflowEnabled: true,
        workifyEnabled: false,
      })

      if (!res || typeof res !== 'object' || !('data' in res) || !res.success || !res.data) {
        setError((res as { error?: string })?.error ?? 'Error al registrar usuario')
        return
      }

      if (!res.data.token) {
        setError('La API no devolvió un token')
        return
      }

      setTokenCookie(res.data.token)
      window.location.href = '/dashboard'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
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

            <Card className="border-white/60 bg-white/85 shadow-2xl backdrop-blur max-h-[82vh]">
              <CardHeader className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs text-indigo-700 shadow-sm">
                  <Sparkles className="h-4 w-4" />
                  Crea tu cuenta
                </div>
                <CardTitle className="text-2xl font-bold">Empieza con ShopFlow</CardTitle>
                <CardDescription>
                  Registra tu empresa y activa el módulo en minutos.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[60vh] overflow-y-auto px-6">
          <form onSubmit={handleSubmit(onSubmit)} method="post" className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  placeholder="Tu nombre"
                  {...register('firstName')}
                  disabled={isLoading}
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  placeholder="Tu apellido"
                  {...register('lastName')}
                  disabled={isLoading}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Nombre de la empresa</Label>
              <Input
                id="companyName"
                placeholder="Mi empresa"
                {...register('companyName')}
                disabled={isLoading}
                className={errors.companyName ? 'border-red-500' : ''}
              />
              {errors.companyName && (
                <p className="text-sm text-red-600">{errors.companyName.message}</p>
              )}
            </div>

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

            <div className="grid gap-4 md:grid-cols-2">
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  disabled={isLoading}
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="termsAccepted"
                  className="mt-1"
                  {...register('termsAccepted')}
                  disabled={isLoading}
                />
                <Label htmlFor="termsAccepted" className="text-sm leading-relaxed">
                  Acepto los{' '}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type="button" variant="link" className="h-auto p-0 text-blue-600">
                        términos y condiciones
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Términos y condiciones</DialogTitle>
                        <DialogDescription>Última actualización: Febrero 12, 2026</DialogDescription>
                      </DialogHeader>
                      <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2 text-sm text-slate-600">
                        <section>
                          <h3 className="text-base font-semibold text-slate-900">1. Uso del servicio</h3>
                          <p className="mt-1">
                            ShopFlow es una plataforma de gestión comercial diseñada para apoyar la operación de negocios. Al crear una
                            cuenta, aceptas utilizar el servicio de manera responsable y conforme a la normativa aplicable en tu país.
                          </p>
                        </section>
                        <section>
                          <h3 className="text-base font-semibold text-slate-900">2. Cuenta y seguridad</h3>
                          <p className="mt-1">
                            Eres responsable de mantener la confidencialidad de tus credenciales y de toda actividad que ocurra en tu
                            cuenta. Notifica cualquier uso no autorizado tan pronto como lo detectes.
                          </p>
                        </section>
                        <section>
                          <h3 className="text-base font-semibold text-slate-900">3. Datos y contenidos</h3>
                          <p className="mt-1">
                            Conservas la propiedad de tus datos. ShopFlow procesa la información necesaria para operar la plataforma y
                            mejorar la experiencia. Nos comprometemos a tratar los datos con medidas de seguridad razonables.
                          </p>
                        </section>
                        <section>
                          <h3 className="text-base font-semibold text-slate-900">4. Disponibilidad</h3>
                          <p className="mt-1">
                            Trabajamos para mantener el servicio disponible, pero pueden ocurrir interrupciones por mantenimiento o causas
                            fuera de nuestro control. Te mantendremos informado cuando sea posible.
                          </p>
                        </section>
                        <section>
                          <h3 className="text-base font-semibold text-slate-900">5. Cambios en los términos</h3>
                          <p className="mt-1">
                            Podremos actualizar estos términos para reflejar mejoras del servicio o cambios legales. Si realizamos cambios
                            relevantes, los comunicaremos oportunamente.
                          </p>
                        </section>
                        <section>
                          <h3 className="text-base font-semibold text-slate-900">6. Contacto</h3>
                          <p className="mt-1">
                            Si tienes preguntas sobre estos términos, puedes escribirnos desde el panel de ayuda una vez iniciada la sesión.
                          </p>
                        </section>
                      </div>
                    </DialogContent>
                  </Dialog>
                  .
                </Label>
              </div>
              {errors.termsAccepted && (
                <p className="text-sm text-red-600">{errors.termsAccepted.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-500 hover:to-blue-500"
              disabled={isLoading}
            >
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                  <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
                    Volver al inicio
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/login" className="text-indigo-600 hover:underline">
                    ¿Ya tienes cuenta? Inicia sesión
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
                Tu negocio,
                <span className="block text-white/90">listo para vender mejor.</span>
              </h2>
              <p className="mt-4 text-base text-white/80">
                Crea tu cuenta, activa ShopFlow y controla ventas, stock y reportes desde el primer día.
              </p>
            </div>
            <div className="rounded-2xl border border-white/25 bg-white/10 p-4 text-sm text-white/85">
              “Arranca rápido, crece con claridad.”
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth-token'
import Link from 'next/link'
import { Button } from '@multisystem/ui'
import Image from 'next/image'
import {
  ArrowRight,
  BarChart3,
  Layers,
  LogIn,
  Package,
  Rocket,
  ShoppingCart,
  Sparkles,
  UserPlus,
} from 'lucide-react'

export default async function LandingPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  // If user is authenticated, redirect to dashboard
  if (token) {
    const decoded = verifyToken(token)
    if (decoded) {
      redirect('/dashboard')
    }
  }

  // Landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_45%)] bg-slate-50">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-indigo-300/30 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 left-0 h-96 w-96 rounded-full bg-blue-300/30 blur-[120px]" />

        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Image
                src="/logo/logo-completo/shopflow-logo-horizontal.png"
                alt="ShopFlow POS"
                width={230}
                height={58}
                priority
              />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" className="px-3 md:px-4">
                <LogIn className="h-4 w-4 md:hidden" />
                <span className="hidden md:inline">Iniciar sesión</span>
              </Button>
            </Link>
            <Link href="/register">
              <Button className="px-3 md:px-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-500 hover:to-blue-500">
                <UserPlus className="h-4 w-4 md:hidden" />
                <span className="hidden md:inline">Crear cuenta</span>
              </Button>
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
          <section className="grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-sm text-indigo-700 shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Una forma más simple de vender y crecer
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
                Tu punto de venta,
                <span className="block bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  inventario y reportes en un solo flujo.
                </span>
              </h1>
              <p className="text-lg text-slate-600">
                ShopFlow te ayuda a vender rápido, ordenar tu inventario y ver lo que importa, sin complicaciones ni pantallas eternas.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-indigo-500" />
                  Empieza en minutos
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-500" />
                  Todo organizado desde el día 1
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-2xl backdrop-blur">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Ventas rápidas</p>
                    <p className="text-sm text-slate-500">Todo lo que necesitas en una sola pantalla.</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Ventas del día</span>
                    <span className="font-semibold text-slate-900">$ 2.450.000</span>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                    <div className="h-2 w-2/3 rounded-full bg-indigo-500" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Reportes claros</p>
                    <p className="text-sm text-slate-500">Decide con datos, sin planillas eternas.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-20">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Beneficios</p>
                <h2 className="text-3xl font-bold text-slate-900">Todo lo esencial, sin ruido.</h2>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: <Package className="h-5 w-5" />,
                  title: 'Inventario inteligente',
                  description: 'Controla productos, variantes y stock mínimo en tiempo real.',
                },
                {
                  icon: <ShoppingCart className="h-5 w-5" />,
                  title: 'Venta fluida',
                  description: 'Cobros ágiles, descuentos rápidos y cierre de caja sin estrés.',
                },
                {
                  icon: <BarChart3 className="h-5 w-5" />,
                  title: 'Reportes claros',
                  description: 'Ve lo que más vende, márgenes y desempeño por día.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-20">
            <div className="mb-10">
              <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Cómo funciona</p>
              <h2 className="text-3xl font-bold text-slate-900">Tres pasos y estás vendiendo.</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  step: '01',
                  title: 'Crea tu cuenta',
                  description: 'Registra tu empresa y define tu equipo en minutos.',
                  icon: <Rocket className="h-5 w-5" />,
                },
                {
                  step: '02',
                  title: 'Carga tu catálogo',
                  description: 'Añade productos, categorías y listas de precios sin complicarte.',
                  icon: <Layers className="h-5 w-5" />,
                },
                {
                  step: '03',
                  title: 'Empieza a vender',
                  description: 'Cobra rápido y revisa reportes desde el primer día.',
                  icon: <ArrowRight className="h-5 w-5" />,
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                      {item.icon}
                    </div>
                    <span className="text-sm font-semibold text-slate-400">{item.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-20">
            <div className="rounded-3xl border border-indigo-200 bg-white/90 px-6 py-10 shadow-lg backdrop-blur md:px-12">
              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Listo para despegar</p>
                  <h2 className="text-3xl font-bold text-slate-900">Activa ShopFlow y vende desde hoy.</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Crea tu cuenta desde el inicio y empieza a vender en minutos.
                  </p>
                </div>
                <Link href="/register" className="text-indigo-600 hover:underline">
                  Crear cuenta ahora
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

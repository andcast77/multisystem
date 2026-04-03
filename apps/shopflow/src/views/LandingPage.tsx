import { Link } from "react-router-dom";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@multisystem/ui";
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
} from "lucide-react";

const featureCards = [
  {
    icon: Package,
    title: "Inventario inteligente",
    description: "Controla productos, variantes y stock minimo en tiempo real.",
  },
  {
    icon: ShoppingCart,
    title: "Venta fluida",
    description: "Cobros agiles, descuentos rapidos y cierre de caja sin estres.",
  },
  {
    icon: BarChart3,
    title: "Reportes claros",
    description: "Ve lo que mas vende, margenes y desempeno por dia.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_45%)] bg-slate-50">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-indigo-300/30 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 left-0 h-96 w-96 rounded-full bg-blue-300/30 blur-[120px]" />

        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo/logo-completo/shopflow-logo-horizontal.png"
              alt="ShopFlow POS"
              className="h-10 w-auto"
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button
                variant="outline"
                className="px-3 md:px-4 border-slate-400 text-slate-900 bg-white hover:bg-slate-100"
              >
                <LogIn className="h-4 w-4 md:hidden" />
                <span className="hidden md:inline">Iniciar sesion</span>
              </Button>
            </Link>
            <Link to="/login">
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
              <Badge variant="secondary" className="inline-flex items-center gap-2 bg-white/80 text-indigo-700 shadow-sm">
                <Sparkles className="h-4 w-4" />
                Una forma mas simple de vender y crecer
              </Badge>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
                Tu punto de venta,
                <span className="block bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  inventario y reportes en un solo flujo.
                </span>
              </h1>
              <p className="text-lg text-slate-600">
                ShopFlow te ayuda a vender rapido, ordenar tu inventario y ver lo que importa, sin complicaciones ni pantallas eternas.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-indigo-500" />
                  Empieza en minutos
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-500" />
                  Todo organizado desde el dia 1
                </div>
              </div>
            </div>

            <Card className="rounded-3xl border border-white/70 bg-white/80 p-2 shadow-2xl backdrop-blur">
              <CardContent className="space-y-6 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Ventas rapidas</p>
                    <p className="text-sm text-slate-700">Todo lo que necesitas en una sola pantalla.</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner">
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span>Ventas del dia</span>
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
                    <p className="text-sm text-slate-700">Decide con datos, sin planillas eternas.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="mt-20">
            <div className="mb-10">
              <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Beneficios</p>
              <h2 className="text-3xl font-bold text-slate-900">Todo lo esencial, sin ruido.</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {featureCards.map((item) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={item.title}
                    className="group rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
                  >
                    <CardHeader>
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600">{item.description}</CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="mt-20">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Crea tu cuenta",
                  description: "Registra tu empresa y define tu equipo en minutos.",
                  icon: Rocket,
                },
                {
                  step: "02",
                  title: "Carga tu catalogo",
                  description: "Anade productos, categorias y listas de precios sin complicarte.",
                  icon: Layers,
                },
                {
                  step: "03",
                  title: "Empieza a vender",
                  description: "Cobra rapido y revisa reportes desde el primer dia.",
                  icon: ArrowRight,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={item.step}
                    className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
                  >
                    <CardHeader>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-semibold text-slate-400">{item.step}</span>
                      </div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600">{item.description}</CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="mt-20">
            <Card className="rounded-3xl border border-indigo-200 bg-white/90 shadow-lg backdrop-blur">
              <CardContent className="flex flex-col items-start justify-between gap-4 px-6 py-10 md:flex-row md:items-center md:px-12">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Listo para despegar</p>
                  <h2 className="text-3xl font-bold text-slate-900">Activa ShopFlow y vende desde hoy.</h2>
                  <p className="mt-2 text-sm text-slate-600">Crea tu cuenta desde el inicio y empieza a vender en minutos.</p>
                </div>
                <Link to="/login" className="text-indigo-600 hover:underline">
                  Crear cuenta ahora
                </Link>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}

import Link from "next/link";
import { cookies } from "next/headers";
import { Hero } from "@/components/Hero";
import { ModuleCard } from "@/components/ModuleCard";
import { FeaturesSection } from "@/components/FeaturesSection";
import { Footer } from "@/components/Footer";
import { AuthActions } from "@/components/AuthActions";
import { ShoppingCart, Users, Wrench, Settings } from "lucide-react";

export default async function Home() {
  const cookieStore = await cookies();
  const hasToken = !!cookieStore.get("token")?.value;

  return (
    <>
      <div className="min-h-screen flex flex-col">
        <header className="border-b-2 border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Multisystem
            </Link>
            <nav>
              <AuthActions hasToken={hasToken} />
            </nav>
          </div>
        </header>

        <main className="flex-grow">
          <Hero hasToken={hasToken} />

          <FeaturesSection />

          <section className="py-20 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                  Módulos disponibles
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Accede a los módulos que tu empresa tiene activados
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ModuleCard
                  icon={<ShoppingCart className="w-8 h-8 text-primary" />}
                  title="ShopFlow"
                  description="Sistema de punto de venta y gestión de inventario"
                  features={["Gestión de productos", "Punto de venta rápido", "Reportes de ventas"]}
                  href="/shopflow"
                />

                <ModuleCard
                  icon={<Users className="w-8 h-8 text-primary" />}
                  title="Workify"
                  description="Sistema de gestión de empleados y horarios"
                  features={["Gestión de turnos", "Control de asistencia", "Nómina integrada"]}
                  href="/workify"
                />

                <ModuleCard
                  icon={<Wrench className="w-8 h-8 text-primary" />}
                  title="Servicios Técnicos"
                  description="Ordenes de trabajo, activos y visitas técnicas"
                  features={["Órdenes de trabajo", "Gestión de activos", "Visitas técnicas"]}
                  href="/techservices"
                />

                <ModuleCard
                  icon={<Settings className="w-8 h-8 text-muted-foreground" />}
                  title="Configuración"
                  description="Configuración del sistema multisystem"
                  disabled={true}
                />
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
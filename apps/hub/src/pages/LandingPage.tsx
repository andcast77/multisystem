import { Link } from "react-router-dom";
import { Hero } from "@/components/Hero";
import { ModuleCard } from "@/components/ModuleCard";
import { FeaturesSection } from "@/components/FeaturesSection";
import { Footer } from "@/components/Footer";
import { AuthActions } from "@/components/AuthActions";
import { ShoppingCart, Users, Wrench, Settings } from "lucide-react";

export function LandingPage() {
  return (
    <>
      <div className="min-h-screen flex flex-col">
        <header className="border-b-2 border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Multisystem
            </Link>
            <nav>
              <AuthActions hasToken={false} />
            </nav>
          </div>
        </header>

        <main className="flex-grow">
          <Hero hasToken={false} />

          <FeaturesSection />

          <section className="py-20 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                  Módulos integrados
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Una plataforma, múltiples soluciones para tu negocio
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <ModuleCard
                  title="ShopFlow POS"
                  description="Punto de venta y gestión de inventario"
                  icon={<ShoppingCart className="w-8 h-8 text-violet-600" />}
                  href="http://localhost:3004"
                />
                <ModuleCard
                  title="Workify"
                  description="Gestión de recursos humanos"
                  icon={<Users className="w-8 h-8 text-blue-600" />}
                  href="http://localhost:3003"
                />
                <ModuleCard
                  title="Tech Services"
                  description="Órdenes de servicio técnico"
                  icon={<Wrench className="w-8 h-8 text-amber-600" />}
                  href="http://localhost:3004"
                />
                <ModuleCard
                  title="Hub"
                  description="Panel y empresas"
                  icon={<Settings className="w-8 h-8 text-slate-600" />}
                  href="/dashboard"
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

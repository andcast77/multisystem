import React from "react";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t-2 border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4">Multisystem</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Plataforma unificada diseñada para empresas modernas. Gestiona tu negocio con herramientas poderosas e integradas.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-5 text-base">Módulos</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/shopflow"
                  className="text-muted-foreground hover:text-primary font-medium transition-colors duration-200"
                >
                  🏪 ShopFlow
                </Link>
              </li>
              <li>
                <Link
                  href="/workify"
                  className="text-muted-foreground hover:text-primary font-medium transition-colors duration-200"
                >
                  👥 Workify
                </Link>
              </li>
              <li>
                <Link
                  href="/techservices"
                  className="text-muted-foreground hover:text-primary font-medium transition-colors duration-200"
                >
                  🛠️ Servicios Técnicos
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-5 text-base">Cuenta</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-primary font-medium transition-colors duration-200"
                >
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-muted-foreground hover:text-primary font-medium transition-colors duration-200"
                >
                  Crear cuenta
                </Link>
              </li>
              <li>
                <Link
                  href="/health"
                  className="text-muted-foreground hover:text-primary font-medium transition-colors duration-200"
                >
                  Estado del sistema
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-5 text-base">Empresa</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary font-medium transition-colors duration-200"
                >
                  Documentación
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary font-medium transition-colors duration-200"
                >
                  Contacto
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary font-medium transition-colors duration-200"
                >
                  Privacidad
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Multisystem. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Términos</a>
              <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
              <a href="#" className="hover:text-primary transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

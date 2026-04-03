import React from "react";
import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0a0a0f] border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-10">
          {/* Brand */}
          <div className="max-w-xs">
            <span className="text-lg font-black text-white tracking-tight block mb-3">
              Multisystem
            </span>
            <p className="text-sm text-white/30 leading-relaxed">
              Plataforma empresarial unificada. POS, RRHH y servicios técnicos
              en un solo lugar.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16">
            <div>
              <h4 className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-4">
                Módulos
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link
                    to="/shopflow"
                    className="text-white/40 hover:text-white transition-colors duration-150"
                  >
                    ShopFlow
                  </Link>
                </li>
                <li>
                  <Link
                    to="/workify"
                    className="text-white/40 hover:text-white transition-colors duration-150"
                  >
                    Workify
                  </Link>
                </li>
                <li>
                  <Link
                    to="/techservices"
                    className="text-white/40 hover:text-white transition-colors duration-150"
                  >
                    Servicios Técnicos
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-4">
                Cuenta
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link
                    to="/login"
                    className="text-white/40 hover:text-white transition-colors duration-150"
                  >
                    Iniciar sesión
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="text-white/40 hover:text-white transition-colors duration-150"
                  >
                    Registrar empresa
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/[0.05] flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-white/20">
            © {currentYear} Multisystem. Todos los derechos reservados.
          </p>
          <div className="flex gap-5 text-xs text-white/20">
            <a href="#" className="hover:text-white/50 transition-colors">
              Términos
            </a>
            <a href="#" className="hover:text-white/50 transition-colors">
              Privacidad
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@multisystem/ui";
import { ArrowRight, Zap, Shield, BarChart3 } from "lucide-react";

type HeroProps = {
  hasToken: boolean;
};

export function Hero({ hasToken }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground py-24 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-foreground/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-foreground/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur px-4 py-2 rounded-full mb-6">
          <Zap className="w-4 h-4" />
          <span className="text-sm font-medium">Solución integral para tu negocio</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Gestión de negocio
          <br />
          <span className="bg-gradient-to-r from-primary-foreground via-primary-foreground/80 to-primary-foreground/60 bg-clip-text text-transparent">
            todo en un lugar
          </span>
        </h1>

        <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto leading-relaxed">
          Multisystem es la plataforma unificada que centraliza tu punto de venta, 
          gestión de empleados y servicios técnicos. Simplifica operaciones, aumenta eficiencia 
          y toma mejores decisiones con datos en tiempo real.
        </p>

        <div className="flex gap-4 justify-center flex-wrap mb-12">
          {!hasToken && (
            <>
              <Link href="/login" className="inline-block">
                <Button variant="default" size="lg" className="gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                  Iniciar sesión
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/register" className="inline-block">
                <Button variant="outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                  Registrar empresa
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-primary-foreground/20">
          <div>
            <div className="text-3xl font-bold">500+</div>
            <div className="text-sm text-primary-foreground/70">Empresas activas</div>
          </div>
          <div>
            <div className="text-3xl font-bold">50k+</div>
            <div className="text-sm text-primary-foreground/70">Usuarios</div>
          </div>
          <div>
            <div className="text-3xl font-bold">99.9%</div>
            <div className="text-sm text-primary-foreground/70">Uptime</div>
          </div>
        </div>
      </div>
    </section>
  );
}

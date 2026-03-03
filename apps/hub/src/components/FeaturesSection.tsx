import React from "react";
import { BarChart3, Lock, Zap, Users } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: Zap,
      title: "Rápido y Eficiente",
      description:
        "Automatiza tus procesos y ahorra tiempo en tareas administrativas. Interfaz intuitiva diseñada para máxima productividad.",
    },
    {
      icon: Users,
      title: "Trabajo en Equipo",
      description:
        "Colaboración en tiempo real entre equipos. Gestión de permisos y roles granulares para cada miembro.",
    },
    {
      icon: BarChart3,
      title: "Análisis Inteligentes",
      description:
        "Dashboards interactivos con métricas en tiempo real. Toma decisiones basadas en datos concretos.",
    },
    {
      icon: Lock,
      title: "Seguridad Certificada",
      description:
        "Encriptación de datos de nivel empresarial. Cumplimiento con estándares internacionales de seguridad.",
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-secondary/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Todo lo que necesitas
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Características diseñadas para impulsar el crecimiento de tu negocio
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-6 rounded-lg border-2 border-border hover:border-primary/50 bg-card hover:bg-primary/5 transition-all duration-300"
              >
                <div className="mb-4 inline-block p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

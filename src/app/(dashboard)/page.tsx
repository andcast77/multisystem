"use client";

import { Link } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import { useCompany } from "@/hooks/useCompany";
import { useCompanyStats } from "@/hooks/useCompanyStats";
import { StatsCard } from "@/components/features/StatsCard";
import { ModuleCard } from "@/components/features/ModuleCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from "@multisystem/ui";
import { Users, UserCheck, Shield, User, Calendar, Settings, Briefcase, ShoppingCart, Wrench } from "lucide-react";

export default function DashboardPage() {
  const { data: user } = useUser();
  const { data: company, isLoading: isLoadingCompany } = useCompany(user?.companyId);
  const { data: stats, isLoading: isLoadingStats } = useCompanyStats(user?.companyId);

  const isOwner = user?.membershipRole === "OWNER";
  const isAdmin = user?.membershipRole === "ADMIN" || isOwner;

  if (isLoadingCompany || isLoadingStats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No se encontró información de la empresa.</p>
        </div>
      </div>
    );
  }

  const modules = [
    {
      title: "Workify",
      description: "Gestión de recursos humanos y nómina",
      icon: Briefcase,
      href: process.env.NEXT_PUBLIC_WORKIFY_URL || "http://localhost:3002",
      enabled: company.workifyEnabled,
      color: "purple",
    },
    {
      title: "Shopflow",
      description: "Punto de venta y gestión de inventario",
      icon: ShoppingCart,
      href: process.env.NEXT_PUBLIC_SHOPFLOW_URL || "http://localhost:3001",
      enabled: company.shopflowEnabled,
      color: "blue",
    },
    {
      title: "TechServices",
      description: "Gestión de servicios técnicos",
      icon: Wrench,
      href: process.env.NEXT_PUBLIC_TECHSERVICES_URL || "http://localhost:3003",
      enabled: company.technicalServicesEnabled,
      color: "green",
    },
  ];

  const enabledModulesCount = modules.filter((m) => m.enabled).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{company.name}</h1>
            <p className="text-slate-600 mt-1">Panel de control de la empresa</p>
          </div>
          {isAdmin && (
            <Link to="/dashboard/settings">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Badge variant={company.isActive ? "default" : "secondary"}>
            {company.isActive ? "Activa" : "Inactiva"}
          </Badge>
          {isOwner && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Propietario</Badge>}
          {user?.membershipRole === "ADMIN" && <Badge variant="outline">Administrador</Badge>}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Miembros"
          value={stats?.totalMembers || 0}
          description="Usuarios en la empresa"
          icon={Users}
        />
        <StatsCard
          title="Propietarios"
          value={stats?.ownerCount || 0}
          description="Owners de la empresa"
          icon={Shield}
        />
        <StatsCard
          title="Administradores"
          value={stats?.adminCount || 0}
          description="Admins con permisos"
          icon={UserCheck}
        />
        <StatsCard
          title="Usuarios"
          value={stats?.userCount || 0}
          description="Usuarios estándar"
          icon={User}
        />
      </div>

      {/* Company Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información de la Empresa</CardTitle>
            <CardDescription>Detalles generales de la empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Nombre:</span>
              <span className="text-sm font-medium">{company.name}</span>
            </div>
            {company.owner && (
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Propietario:</span>
                <span className="text-sm font-medium">{company.owner.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Creada:</span>
              <span className="text-sm font-medium">
                {new Date(company.createdAt).toLocaleDateString("es-ES")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Módulos activos:</span>
              <span className="text-sm font-medium">{enabledModulesCount} de 3</span>
            </div>
            {company.taxId && (
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">RFC/Tax ID:</span>
                <span className="text-sm font-medium">{company.taxId}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Último Miembro Agregado</CardTitle>
            <CardDescription>Actividad reciente</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.lastMember ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-full">
                    <User className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{stats.lastMember.name}</p>
                    <p className="text-xs text-slate-600">{stats.lastMember.email}</p>
                  </div>
                  <Badge variant="secondary">{stats.lastMember.membershipRole}</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="h-3 w-3" />
                  Agregado el {new Date(stats.lastMember.createdAt).toLocaleDateString("es-ES")}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No hay miembros recientes</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modules */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Módulos Disponibles</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <ModuleCard key={module.title} {...module} />
          ))}
        </div>
        {enabledModulesCount === 0 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              No hay módulos activos. {isOwner && "Activa módulos desde la configuración."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { authApi } from "@/lib/api/client";

type CompanyOption = {
  id: string;
  name: string;
  workifyEnabled?: boolean;
  shopflowEnabled?: boolean;
  technicalServicesEnabled?: boolean;
};

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const TOKEN_COOKIE_NAME = "token";

function setTokenCookie(token: string) {
  document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyOption[] | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectingCompany, setSelectingCompany] = useState(false);

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.post<{
        success?: boolean;
        data?: {
          token?: string;
          companyId?: string;
          company?: CompanyOption;
          companies?: CompanyOption[];
        };
        error?: string;
      }>("/login", { email, password });

      if (!res?.success || !res.data?.token) {
        setError(res?.error || "Error al iniciar sesion");
        return;
      }

      const { token, company, companies: companyList } = res.data;
      setTokenCookie(token);

      if (company) {
        window.location.href = "/dashboard";
        return;
      }

      if (companyList && companyList.length > 1) {
        setCompanies(companyList);
        setSelectedCompanyId(companyList[0].id);
        setSelectingCompany(true);
        return;
      }

      if (companyList && companyList.length === 1) {
        const ctx = await authApi.post<{ success?: boolean; data?: { token?: string } }>("/context", {
          companyId: companyList[0].id,
        });
        if (ctx?.success && ctx.data?.token) {
          setTokenCookie(ctx.data.token);
          window.location.href = "/dashboard";
          return;
        }
      }

      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexion");
    } finally {
      setLoading(false);
    }
  }

  async function handleCompanySelect(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCompanyId) return;
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.post<{
        success?: boolean;
        data?: { token?: string };
        error?: string;
      }>("/context", {
        companyId: selectedCompanyId,
      });
      if (!res?.success || !res.data?.token) {
        setError(res?.error ?? "Error al seleccionar empresa");
        return;
      }
      setTokenCookie(res.data.token);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexion");
    } finally {
      setLoading(false);
    }
  }

  if (selectingCompany && companies && companies.length > 1) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-center mb-4">Selecciona empresa</h1>
          <p className="text-slate-600 text-sm text-center mb-6">
            Tienes acceso a varias empresas. Elige con cual continuar.
          </p>
          <form onSubmit={handleCompanySelect} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                required
                className="w-full border border-slate-300 rounded px-3 py-2"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-2 rounded font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Continuando..." : "Continuar"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-center mb-4">Servicios Tecnicos</h1>
        <p className="text-slate-600 text-sm text-center mb-6">Inicia sesion para continuar.</p>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-slate-300 rounded px-3 py-2"
              placeholder="tu@empresa.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contrasena *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-slate-300 rounded px-3 py-2"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-2 rounded font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Iniciando sesion..." : "Iniciar sesion"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          <Link href="/" className="text-slate-700 hover:underline">
            Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { authApi } from "@/lib/api-client";
import { setTokenCookie } from "@/lib/auth";

type Company = {
  id: string;
  name: string;
  workifyEnabled: boolean;
  shopflowEnabled: boolean;
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectingCompany, setSelectingCompany] = useState(false);

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      if (!res.success || !res.data) {
        setError(res.error || "Error al iniciar sesión");
        return;
      }

      const { token, company, companies: companiesList } = res.data;

      setTokenCookie(token);

      if (company) {
        window.location.href = "/";
        return;
      }

      if (companiesList && companiesList.length > 1) {
        setCompanies(companiesList);
        setSelectedCompanyId(companiesList[0].id);
        setSelectingCompany(true);
        return;
      }

      if (companiesList && companiesList.length === 1) {
        const ctx = await authApi.context(companiesList[0].id);
        if (ctx.success && ctx.data?.token) {
          setTokenCookie(ctx.data.token);
          window.location.href = "/";
          return;
        }
      }

      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
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
      const res = await authApi.context(selectedCompanyId);
      if (!res.success || !res.data?.token) {
        setError(res.error || "Error al seleccionar empresa");
        return;
      }
      setTokenCookie(res.data.token);
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  if (selectingCompany && companies && companies.length > 1) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Selecciona empresa</h1>
          <p className="text-gray-600 text-sm text-center mb-4">
            Tienes acceso a varias empresas. Elige con cuál quieres continuar.
          </p>

          <form onSubmit={handleCompanySelect} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
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
              className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Continuando…" : "Continuar"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            <Link href="/" className="text-blue-600 hover:underline">
              Volver al Hub
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Iniciar sesión</h1>
        <p className="text-gray-600 text-sm text-center mb-4">
          Introduce tus credenciales para acceder al Hub.
        </p>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="tu@empresa.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Iniciando sesión…" : "Iniciar sesión"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4 space-x-2">
          <Link href="/" className="text-blue-600 hover:underline">
            Volver al Hub
          </Link>
          <span>·</span>
          <Link href="/register" className="text-blue-600 hover:underline">
            ¿No tienes cuenta? Registrar empresa
          </Link>
        </p>
      </div>
    </main>
  );
}

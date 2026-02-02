"use client";

import Link from "next/link";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [workifyEnabled, setWorkifyEnabled] = useState(true);
  const [shopflowEnabled, setShopflowEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          companyName: companyName.trim() || undefined,
          workifyEnabled,
          shopflowEnabled,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Error al registrar");
        return;
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
          <h1 className="text-xl font-semibold text-green-700 mb-2">Empresa registrada</h1>
          <p className="text-gray-600 mb-4">
            Ya puedes iniciar sesión y acceder a los módulos activos desde el Hub.
          </p>
          <Link
            href="/"
            className="inline-block text-blue-600 hover:underline"
          >
            Volver al Hub
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Registrar empresa</h1>
        <p className="text-gray-600 text-sm text-center mb-4">
          Crea tu cuenta y registra tu empresa. Solo desde el Hub puedes dar de alta nuevas empresas.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la empresa *</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Mi Empresa S.L."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Juan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="García"
              />
            </div>
          </div>
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
              minLength={6}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Módulos a activar</label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={workifyEnabled}
                onChange={(e) => setWorkifyEnabled(e.target.checked)}
                className="rounded"
              />
              <span>Workify (RRHH y empleados)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={shopflowEnabled}
                onChange={(e) => setShopflowEnabled(e.target.checked)}
                className="rounded"
              />
              <span>Shopflow (ventas e inventario)</span>
            </label>
          </div>
          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Registrando…" : "Registrar empresa"}
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

"use client";

import Link from "next/link";
import { clearTokenCookie } from "@/lib/auth";

type Props = {
  hasToken: boolean;
};

export function AuthActions({ hasToken }: Props) {
  function handleLogout() {
    clearTokenCookie();
    window.location.href = "/";
  }

  if (hasToken) {
    return (
      <button
        onClick={handleLogout}
        className="text-sm font-medium text-white/60 hover:text-white transition-colors duration-150 px-4 py-2 rounded-lg hover:bg-white/5"
      >
        Cerrar sesión
      </button>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex items-center text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
    >
      Iniciar sesión
    </Link>
  );
}

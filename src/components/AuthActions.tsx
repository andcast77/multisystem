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
        className="bg-gray-600 text-white px-4 py-2 rounded font-medium hover:bg-gray-700"
      >
        Cerrar sesión
      </button>
    );
  }

  return (
    <Link
      href="/login"
      className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700"
    >
      Iniciar sesión
    </Link>
  );
}

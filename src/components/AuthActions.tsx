"use client";

import Link from "next/link";
import { Button } from "@multisystem/ui";
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
      <Button
        onClick={handleLogout}
        variant="secondary"
        size="md"
      >
        Cerrar sesión
      </Button>
    );
  }

  return (
    <Link href="/login" className="inline-block">
      <Button variant="default" size="md">
        Iniciar sesión
      </Button>
    </Link>
  );
}

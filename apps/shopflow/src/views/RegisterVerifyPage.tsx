"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { ApiError, runRegisterVerifyDeduped } from "@multisystem/shared";
import type { ApiResponse, RegisterResponse } from "@multisystem/contracts";
import { accountApi, authApi } from "@/lib/api/client";
import {
  AuthLayout,
  AuthBrandDecorativePanel,
  AuthBrandWelcomeHeader,
  AuthBrandErrorAlert,
  AuthBrandCard,
  AUTH_BRAND_PRIMARY_BUTTON_CLASS,
} from "@multisystem/ui";

function RegisterVerifyInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState("");
  const [busy, setBusy] = useState(true);

  const run = useCallback(async () => {
    setBusy(true);
    setErrorMessage("");
    const token = searchParams.get("token")?.trim() ?? "";
    const emailParam = searchParams.get("email")?.trim().toLowerCase() ?? "";
    if (!token || !emailParam) {
      setErrorMessage("Enlace incompleto. Vuelve a registrarte.");
      setBusy(false);
      return;
    }

    try {
      await runRegisterVerifyDeduped(emailParam, token, async () => {
        const verifyRes = await authApi.post<ApiResponse<RegisterResponse>>("/register/link/verify", {
          email: emailParam,
          token,
        });
        if (!verifyRes.success || !verifyRes.data?.user) {
          throw new Error(verifyRes.error || verifyRes.message || "No se pudo validar el enlace.");
        }
        try {
          await accountApi.acceptPrivacy();
        } catch {
          // non-blocking
        }
        router.push("/dashboard");
      });
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Error al completar el registro.",
      );
    } finally {
      setBusy(false);
    }
  }, [router, searchParams]);

  useEffect(() => {
    void run();
  }, [run]);

  const panel = (
    <AuthBrandDecorativePanel
      badge="Shopflow"
      title="Confirmando registro"
      description="Validamos tu enlace."
      quote={<>De la vitrina a la caja, sin fricción.</>}
    />
  );

  return (
    <AuthLayout
      variant="brand"
      contentClassName="max-w-lg"
      panel={panel}
      className="shopflow-auth-shell shopflow-auth-layout"
    >
      <AuthBrandWelcomeHeader
        title="Verificación"
        subtitle={busy && !errorMessage ? "Un momento…" : "Registro con enlace"}
      />
      <AuthBrandCard
        cardTitle="Shopflow"
        cardDescription={
          busy && !errorMessage ? "Por favor espera." : "Si falló, vuelve al registro."
        }
      >
        {errorMessage ? (
          <AuthBrandErrorAlert variant="error">
            <p className="text-sm text-red-200">{errorMessage}</p>
          </AuthBrandErrorAlert>
        ) : null}
        {!busy && errorMessage ? (
          <Link href="/register" className={AUTH_BRAND_PRIMARY_BUTTON_CLASS}>
            Volver al registro
          </Link>
        ) : null}
      </AuthBrandCard>
    </AuthLayout>
  );
}

export function RegisterVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white/80">
          Cargando…
        </div>
      }
    >
      <RegisterVerifyInner />
    </Suspense>
  );
}

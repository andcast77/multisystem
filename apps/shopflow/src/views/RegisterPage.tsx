"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@multisystem/shared";
import {
  AuthLayout,
  AuthBrandDecorativePanel,
  AuthBrandWelcomeHeader,
  AuthBrandCard,
  AuthBrandErrorAlert,
  AuthBrandFooterCenter,
  AUTH_BRAND_INPUT_CLASS,
  AUTH_BRAND_LABEL_CLASS,
  AUTH_BRAND_PRIMARY_BUTTON_CLASS,
  AUTH_BRAND_OUTLINE_BUTTON_CLASS,
  Button,
  Input,
  Label,
} from "@multisystem/ui";
import { authApi } from "@/lib/api/client";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { RegistrationTurnstile } from "@/components/auth/RegistrationTurnstile";

type Step = "form" | "otp";

export function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterInput>({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [resendCaptcha, setResendCaptcha] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const decorativePanel = (
    <AuthBrandDecorativePanel
      badge="Shopflow"
      title="Tu punto de venta"
      description="Catálogo, ventas y stock con la misma cáscara de auth que el Hub: solo cambia el texto, no el layout."
      quote={<>De la vitrina a la caja, sin fricción.</>}
    />
  );

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Formulario inválido");
      return;
    }
    if (!form.termsAccepted) return;
    if (!captchaToken?.trim()) {
      setError("Completa la verificación anti-robots (captcha).");
      return;
    }
    setIsLoading(true);
    try {
      await authApi.post("/register/otp/send", {
        email: form.email.trim().toLowerCase(),
        captchaToken,
      });
      setStep("otp");
      setOtpCode("");
      setCaptchaToken(null);
      setResendCaptcha(null);
      setTurnstileKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo enviar el código.");
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyAndRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const code = otpCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setError("Introduce el código de 6 dígitos.");
      return;
    }
    setIsVerifying(true);
    try {
      const verifyRes = await authApi.post<{
        success?: boolean;
        data?: { registrationTicket?: string };
        error?: string;
      }>("/register/otp/verify", {
        email: form.email.trim().toLowerCase(),
        code,
      });
      if (
        verifyRes &&
        typeof verifyRes === "object" &&
        "success" in verifyRes &&
        verifyRes.success === false
      ) {
        setError((verifyRes as { error?: string }).error || "Código incorrecto.");
        return;
      }
      const ticket =
        (verifyRes as { data?: { registrationTicket?: string } })?.data?.registrationTicket;
      if (!ticket) {
        setError("Respuesta inválida del servidor.");
        return;
      }

      await authApi.post("/register", {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        companyName: form.companyName,
        shopflowEnabled: true,
        workifyEnabled: false,
        registrationTicket: ticket,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo completar el registro.");
    } finally {
      setIsVerifying(false);
    }
  }

  async function resendOtp() {
    setError(null);
    if (!resendCaptcha?.trim()) {
      setError("Completa el captcha para reenviar el código.");
      return;
    }
    setIsLoading(true);
    try {
      await authApi.post("/register/otp/send", {
        email: form.email.trim().toLowerCase(),
        captchaToken: resendCaptcha,
      });
      setResendCaptcha(null);
      setTurnstileKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo reenviar el código.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout
      variant="brand"
      contentClassName="max-w-lg"
      panel={decorativePanel}
      className="shopflow-auth-shell shopflow-auth-layout"
    >
      <AuthBrandWelcomeHeader
        title="Crear cuenta"
        subtitle={
          step === "otp" ? "Revisa tu bandeja e introduce el código" : "Completa los datos para usar Shopflow"
        }
      />

      <AuthBrandCard
        cardTitle={step === "otp" ? "Verifica tu email" : "Registrarse"}
        cardDescription={
          step === "otp"
            ? "Introduce el código de 6 dígitos que enviamos a tu correo."
            : "Completa los campos; luego te enviaremos un código de verificación."
        }
        footer={
          <AuthBrandFooterCenter>
            <p className="text-sm text-white/50">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-indigo-300 hover:text-indigo-200 font-medium">
                Inicia sesión
              </Link>
            </p>
          </AuthBrandFooterCenter>
        }
      >
        {step === "otp" ? (
          <form className="space-y-3" onSubmit={(e) => void verifyAndRegister(e)}>
            <p className="text-sm text-white/70">
              Código enviado a <strong className="text-white">{form.email}</strong>
            </p>
            <div className="space-y-2">
              <Label className={AUTH_BRAND_LABEL_CLASS}>Código de verificación</Label>
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                className={AUTH_BRAND_INPUT_CLASS}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </div>
            {error ? (
              <AuthBrandErrorAlert variant="error">
                <p className="text-sm text-red-200">{error}</p>
              </AuthBrandErrorAlert>
            ) : null}
            <Button
              type="submit"
              className={AUTH_BRAND_PRIMARY_BUTTON_CLASS}
              disabled={isVerifying}
            >
              {isVerifying ? "Verificando…" : "Verificar y crear cuenta"}
            </Button>
            <div className="space-y-3 pt-3">
              <p className="text-center text-xs text-white/45">¿No recibiste el código?</p>
              <RegistrationTurnstile
                key={`resend-${turnstileKey}`}
                onToken={setResendCaptcha}
                variant="compact"
              />
              <Button
                type="button"
                variant="outline"
                disabled={!resendCaptcha?.trim() || isLoading}
                onClick={() => void resendOtp()}
                className={AUTH_BRAND_OUTLINE_BUTTON_CLASS}
              >
                {isLoading ? "Enviando…" : "Reenviar código"}
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="text-white/60 hover:text-white"
              onClick={() => {
                setStep("form");
                setOtpCode("");
                setError(null);
                setCaptchaToken(null);
                setTurnstileKey((k) => k + 1);
              }}
            >
              Volver y editar datos
            </Button>
          </form>
        ) : (
          <form className="flex flex-col gap-2" onSubmit={(e) => void sendOtp(e)}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className={AUTH_BRAND_LABEL_CLASS}>Nombre</Label>
                <Input
                  className={AUTH_BRAND_INPUT_CLASS}
                  value={form.firstName}
                  onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className={AUTH_BRAND_LABEL_CLASS}>Apellido</Label>
                <Input
                  className={AUTH_BRAND_INPUT_CLASS}
                  value={form.lastName}
                  onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className={AUTH_BRAND_LABEL_CLASS}>Empresa</Label>
              <Input
                className={AUTH_BRAND_INPUT_CLASS}
                value={form.companyName}
                onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className={AUTH_BRAND_LABEL_CLASS}>Email</Label>
              <Input
                type="email"
                className={AUTH_BRAND_INPUT_CLASS}
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="tu@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label className={AUTH_BRAND_LABEL_CLASS}>Contraseña</Label>
              <Input
                type="password"
                className={AUTH_BRAND_INPUT_CLASS}
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label className={AUTH_BRAND_LABEL_CLASS}>Confirmar contraseña</Label>
              <Input
                type="password"
                className={AUTH_BRAND_INPUT_CLASS}
                value={form.confirmPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                className="accent-indigo-500"
                checked={form.termsAccepted}
                onChange={(e) => setForm((prev) => ({ ...prev, termsAccepted: e.target.checked }))}
              />
              Acepto los{" "}
              <Link className="text-indigo-300 underline hover:text-indigo-200" href="/terms">
                términos
              </Link>
            </label>
            {error ? (
              <AuthBrandErrorAlert variant="error">
                <p className="text-sm text-red-200">{error}</p>
              </AuthBrandErrorAlert>
            ) : null}
            <div className="flex flex-col gap-1.5">
              <span className="sr-only">Verificación antispam antes de enviar el código.</span>
              <RegistrationTurnstile key={turnstileKey} onToken={setCaptchaToken} variant="compact" />
              <Button
                type="submit"
                className={AUTH_BRAND_PRIMARY_BUTTON_CLASS}
                disabled={isLoading || !form.termsAccepted}
              >
                {isLoading ? "Enviando código…" : "Enviar código de verificación"}
              </Button>
            </div>
          </form>
        )}
      </AuthBrandCard>
    </AuthLayout>
  );
}

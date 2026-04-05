import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "@/lib/api-client";
import { ApiError } from "@multisystem/shared";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import {
  AuthLayout,
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@multisystem/ui";

function safeNextPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  return raw;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = useMemo(
    () => safeNextPath(searchParams.get("next")),
    [searchParams]
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [resendHint, setResendHint] = useState<string | null>(null);

  const [mfaStep, setMfaStep] = useState(false);
  const [mfaTempToken, setMfaTempToken] = useState<string | null>(null);
  const [mfaCompanyId, setMfaCompanyId] = useState<string | undefined>(undefined);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaUseBackup, setMfaUseBackup] = useState(false);
  const [mfaSubmitting, setMfaSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        await authApi.me();
        navigate(nextPath ?? "/dashboard", { replace: true });
      } catch {
        // Not logged in, stay on login page
      }
    };

    checkAuth();
  }, [navigate, nextPath]);

  async function onSubmit(data: LoginInput) {
    try {
      setErrorMessage("");
      setNeedsVerification(false);
      setUserEmail(data.email);

      const res = await authApi.login(data.email, data.password);
      if (!res.success || !res.data) {
        setErrorMessage(res.error || "No se pudo iniciar sesión. Revisa tus credenciales.");
        return;
      }

      if (res.data.mfaRequired && res.data.tempToken) {
        setMfaStep(true);
        setMfaTempToken(res.data.tempToken);
        setMfaCompanyId(res.data.companyId);
        setMfaCode("");
        setMfaUseBackup(false);
        setErrorMessage("");
        return;
      }

      navigate(nextPath ?? "/dashboard", { replace: true });
    } catch (err: unknown) {
      console.error("Login error:", err);

      if (err instanceof ApiError && err.code === "ACCOUNT_LOCKED") {
        setErrorMessage(err.message);
        return;
      }

      // Legacy axios-style shape (if any caller still used it)
      const errorData = (err as { response?: { data?: { verified?: boolean; error?: string } } })?.response?.data;
      if (errorData?.verified === false) {
        setNeedsVerification(true);
        setErrorMessage(errorData.error || "Debes verificar tu email antes de iniciar sesión");
      } else {
        setErrorMessage(err instanceof Error ? err.message : "Error al iniciar sesión. Verifica tus credenciales.");
      }
    }
  }

  async function onSubmitMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaTempToken || !mfaCode.trim()) {
      setErrorMessage("Introduce el código.");
      return;
    }
    setMfaSubmitting(true);
    setErrorMessage("");
    try {
      const res = mfaUseBackup
        ? await authApi.verifyMfaBackup(mfaTempToken, mfaCode.trim(), mfaCompanyId)
        : await authApi.verifyMfa(mfaTempToken, mfaCode.trim(), mfaCompanyId);
      if (!res.success || !res.data) {
        setErrorMessage(res.error || "Código inválido.");
        return;
      }
      navigate(nextPath ?? "/dashboard", { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === "ACCOUNT_LOCKED") {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err instanceof Error ? err.message : "Código inválido.");
      }
    } finally {
      setMfaSubmitting(false);
    }
  }

  const decorativePanel = (
    <>
      <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs text-indigo-700 font-medium mb-6 shadow-sm">
        <span>✨</span>
        <span>Multisystem Hub</span>
      </div>

      <h2 className="text-4xl font-bold text-white mb-4">
        Gestiona tus módulos
      </h2>
      <p className="text-white/80 text-lg leading-relaxed">
        Accede a todas tus herramientas de negocio en un solo lugar. Workify, Shopflow,
        Technical Services y más.
      </p>

      <div className="mt-8 pt-8 border-t border-white/30">
        <p className="text-white/60 text-sm italic">
          "Centraliza tu negocio, amplía tus posibilidades."
        </p>
      </div>
    </>
  );

  return (
    <AuthLayout panel={decorativePanel}>
      {/* Logo/Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Bienvenido</h1>
        <p className="text-slate-600 mt-2">Accede a tu cuenta del Hub</p>
      </div>

      {/* Login Form Card */}
      <Card className="border-white/60 bg-white/85 shadow-2xl backdrop-blur">
        <CardHeader>
          <CardTitle>{mfaStep ? "Verificación en dos pasos" : "Iniciar sesión"}</CardTitle>
          <CardDescription>
            {mfaStep
              ? mfaUseBackup
                ? "Introduce un código de respaldo de un solo uso."
                : "Introduce el código de tu app autenticadora."
              : "Introduce tus credenciales"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mfaStep ? (
            <form onSubmit={onSubmitMfa} className="space-y-4">
              {errorMessage ? (
                <div className="p-3 rounded-lg border bg-red-50 border-red-200">
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="mfa-code">{mfaUseBackup ? "Código de respaldo" : "Código TOTP"}</Label>
                <Input
                  id="mfa-code"
                  type="text"
                  inputMode={mfaUseBackup ? "text" : "numeric"}
                  autoComplete="one-time-code"
                  placeholder={mfaUseBackup ? "XXXX-XXXX-XXXX" : "000000"}
                  value={mfaCode}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setMfaCode(e.target.value)}
                  className="rounded-md"
                />
              </div>
              <Button
                type="button"
                variant="link"
                className="text-sm p-0 h-auto text-indigo-600"
                onClick={() => {
                  setMfaUseBackup(!mfaUseBackup);
                  setMfaCode("");
                  setErrorMessage("");
                }}
              >
                {mfaUseBackup ? "Usar código de la app autenticadora" : "Usar código de respaldo"}
              </Button>
              <Button
                type="submit"
                disabled={mfaSubmitting}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium py-2 rounded-md transition-all"
              >
                {mfaSubmitting ? "Verificando…" : "Continuar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setMfaStep(false);
                  setMfaTempToken(null);
                  setMfaCode("");
                  setErrorMessage("");
                }}
              >
                Volver
              </Button>
            </form>
          ) : null}
          {!mfaStep ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Error Message */}
            {errorMessage && (
              <div className={`p-3 rounded-lg border ${
                needsVerification
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-sm ${
                  needsVerification ? 'text-amber-700' : 'text-red-700'
                }`}>
                  {needsVerification
                    ? 'Tu cuenta no está verificada. Será eliminada en 7 días si no la verificas. Revisa tu email para activar tu cuenta.'
                    : errorMessage}
                </p>
                {needsVerification && (
                  <div className="mt-2 space-y-1">
                    <Button
                      type="button"
                      variant="link"
                      className="text-xs text-amber-700 hover:text-amber-800 p-0 h-auto"
                      onClick={async () => {
                        try {
                          setResendHint(null);
                          await authApi.resendVerification(userEmail);
                          setResendHint(
                            "Te enviamos otro correo de verificación. Revisa tu bandeja de entrada."
                          );
                        } catch {
                          setResendHint(
                            "No pudimos reenviar el correo. Inténtalo de nuevo más tarde."
                          );
                        }
                      }}
                    >
                      Reenviar email de verificación
                    </Button>
                    {resendHint ? (
                      <p className="text-xs text-amber-800">{resendHint}</p>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@empresa.com"
                {...register("email")}
                className={`rounded-md ${errors.email ? "border-red-500" : ""}`}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className={`rounded-md ${errors.password ? "border-red-500" : ""}`}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium py-2 rounded-md transition-all"
            >
              {isSubmitting ? "Iniciando sesión…" : "Iniciar sesión"}
            </Button>
          </form>
          ) : null}

          {/* Links */}
          {!mfaStep ? (
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-slate-600">
              ¿No tienes cuenta?{" "}
              <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Registrarse
              </Link>
            </p>
            <p className="text-xs text-slate-500">
              <Link to="/" className="text-slate-600 hover:text-slate-700">
                Volver al Hub
              </Link>
            </p>
          </div>
          ) : null}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

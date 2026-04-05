import { useMemo, useState } from "react";
import { AuthLayout, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@multisystem/ui";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { ApiResponse, LoginResponse } from "@multisystem/contracts";
import { loginSchema } from "@/lib/validations/auth";
import { authApi } from "@/lib/api/client";
const brandCard =
  "border border-white/10 bg-white/5 text-white shadow-none backdrop-blur-md ring-1 ring-white/10";
const brandInput =
  "rounded-md bg-white/10 border-white/20 text-white placeholder:text-white/40";
const brandLabel = "text-white/80";


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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaTempToken, setMfaTempToken] = useState<string | null>(null);
  const [mfaCompanyId, setMfaCompanyId] = useState<string | undefined>(undefined);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaBackup, setMfaBackup] = useState(false);

  const decorativePanel = (
    <>
      <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-indigo-200 font-medium mb-6">
        <span>Shopflow</span>
      </div>
      <h2 className="text-4xl font-bold text-white mb-4">Operacion centralizada</h2>
      <p className="text-white/80 text-lg leading-relaxed">
        Coherencia con Multisystem Hub y acceso al modulo Shopflow.
      </p>
    </>
  );

  return (
    <AuthLayout variant="brand" panel={decorativePanel}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Bienvenido</h1>
        <p className="mt-2 text-white/50">Accede a tu cuenta de Shopflow</p>
      </div>
      <Card className={brandCard}>
        <CardHeader>
          <CardTitle className="text-white">{mfaStep ? "Verificacion en dos pasos" : "Iniciar sesion"}</CardTitle>
          <CardDescription className="text-white/60">
            {mfaStep
              ? "Introduce el codigo de tu app autenticadora o un codigo de respaldo."
              : "Ingresa el email y la contraseña de tu cuenta Multisystem para usar Shopflow."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!mfaStep ? (
            <>
              <div className="space-y-2">
                <Label className={brandLabel}>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={brandInput} />
              </div>
              <div className="space-y-2">
                <Label className={brandLabel}>Contrasena</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={brandInput} />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label className={brandLabel}>{mfaBackup ? "Codigo de respaldo" : "Codigo TOTP"}</Label>
                <Input
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder={mfaBackup ? "XXXX-XXXX-XXXX" : "000000"}
                  className={brandInput}
                />
              </div>
              <Button
                type="button"
                variant="link"
                className="text-sm p-0 h-auto text-indigo-300 hover:text-indigo-200"
                onClick={() => {
                  setMfaBackup(!mfaBackup);
                  setMfaCode("");
                }}
              >
                {mfaBackup ? "Usar codigo TOTP" : "Usar codigo de respaldo"}
              </Button>
            </>
          )}
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <Button
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-xl shadow-lg shadow-indigo-500/25"
            disabled={isLoading}
            onClick={async () => {
              setError(null);
              if (mfaStep && mfaTempToken) {
                const parsedCode = mfaCode.trim();
                if (!parsedCode) {
                  setError("Introduce el codigo.");
                  return;
                }
                setIsLoading(true);
                try {
                  const res = mfaBackup
                    ? await authApi.post<ApiResponse<LoginResponse>>("/mfa/verify-backup", {
                        tempToken: mfaTempToken,
                        backupCode: parsedCode,
                        companyId: mfaCompanyId,
                      })
                    : await authApi.post<ApiResponse<LoginResponse>>("/mfa/verify", {
                        tempToken: mfaTempToken,
                        totpCode: parsedCode,
                        companyId: mfaCompanyId,
                      });
                  if (!res.success || !res.data) {
                    setError(res.error || "Codigo invalido");
                    return;
                  }
                  navigate(nextPath ?? "/dashboard", { replace: true });
                } catch (e) {
                  setError(e instanceof Error ? e.message : "No se pudo verificar");
                } finally {
                  setIsLoading(false);
                }
                return;
              }
              const parsed = loginSchema.safeParse({ email, password });
              if (!parsed.success) {
                setError(parsed.error.issues[0]?.message || "Datos invalidos");
                return;
              }
              setIsLoading(true);
              try {
                const res = await authApi.post<ApiResponse<LoginResponse>>("/login", { email, password });
                if (!res.success || !res.data) {
                  setError(res.error || "Credenciales invalidas");
                  return;
                }
                if (res.data.mfaRequired && res.data.tempToken) {
                  setMfaStep(true);
                  setMfaTempToken(res.data.tempToken);
                  setMfaCompanyId(res.data.companyId);
                  setMfaCode("");
                  setMfaBackup(false);
                  return;
                }
                navigate(nextPath ?? "/dashboard", { replace: true });
              } catch (e) {
                setError(e instanceof Error ? e.message : "No se pudo iniciar sesion");
              } finally {
                setIsLoading(false);
              }
            }}
          >
            {isLoading ? "Ingresando..." : mfaStep ? "Continuar" : "Entrar al dashboard"}
          </Button>
          {mfaStep ? (
            <Button
              type="button"
              variant="outline"
              className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
              onClick={() => {
                setMfaStep(false);
                setMfaTempToken(null);
                setMfaCode("");
                setError(null);
              }}
            >
              Volver
            </Button>
          ) : (
            <>
              <Link to="/" className="block">
                <Button variant="outline" className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10">
                  Volver a la landing
                </Button>
              </Link>
              <Link to="/register" className="block">
                <Button variant="outline" className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10">
                  Crear cuenta
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

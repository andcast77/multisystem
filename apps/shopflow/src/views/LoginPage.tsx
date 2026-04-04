import { useMemo, useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@multisystem/ui";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { loginSchema } from "@/lib/validations/auth";
import { authApi } from "@/lib/api/client";

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

  return (
    <main className="min-h-screen bg-slate-50 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] overflow-hidden">
      <div className="flex items-center justify-center p-4 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Bienvenido</h1>
            <p className="mt-2 text-slate-600">Accede a tu cuenta de Shopflow</p>
          </div>

          <Card className="border-white/60 bg-white/85 shadow-2xl backdrop-blur">
            <CardHeader>
              <CardTitle>Iniciar sesion</CardTitle>
              <CardDescription>
                Ingresa el email y la contraseña de tu cuenta Multisystem para usar Shopflow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Contrasena</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button
                className="w-full"
                disabled={isLoading}
                onClick={async () => {
                  setError(null);
                  const parsed = loginSchema.safeParse({ email, password });
                  if (!parsed.success) {
                    setError(parsed.error.issues[0]?.message || "Datos invalidos");
                    return;
                  }
                  setIsLoading(true);
                  try {
                    await authApi.post("/login", { email, password });
                    navigate(nextPath ?? "/dashboard", { replace: true });
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "No se pudo iniciar sesion");
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                {isLoading ? "Ingresando..." : "Entrar al dashboard"}
              </Button>
              <Link to="/" className="block">
                <Button variant="outline" className="w-full">Volver a la landing</Button>
              </Link>
              <Link to="/register" className="block">
                <Button variant="outline" className="w-full">Crear cuenta</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="hidden lg:flex flex-col items-center justify-center relative bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 p-12">
        <div className="absolute -top-40 left-20 h-[520px] w-[520px] rounded-full border border-white/30" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/20 blur-3xl" />
        <div className="relative z-10 text-center max-w-sm">
          <h2 className="text-4xl font-bold text-white mb-4">Operacion centralizada</h2>
          <p className="text-white/80 text-lg leading-relaxed">
            Mantiene coherencia visual con Hub y acceso al modulo Shopflow.
          </p>
        </div>
      </div>
    </main>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AuthLayout,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@multisystem/ui";
import { authApi } from "@/lib/api/client";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

const brandCard =
  "border border-white/10 bg-white/5 text-white shadow-none backdrop-blur-md ring-1 ring-white/10";
const brandInput =
  "rounded-md bg-white/10 border-white/20 text-white placeholder:text-white/40";
const brandLabel = "text-white/80";

export function RegisterPage() {
  const navigate = useNavigate();
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

  const decorativePanel = (
    <>
      <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-indigo-200 font-medium mb-6">
        <span>Shopflow</span>
      </div>
      <h2 className="text-4xl font-bold text-white mb-4">Tu punto de venta</h2>
      <p className="text-white/80 text-lg leading-relaxed">
        Misma identidad Multisystem que el Hub: oscuro, claro y listo para operar.
      </p>
    </>
  );

  return (
    <AuthLayout variant="brand" contentClassName="max-w-lg" panel={decorativePanel}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Crear cuenta</h1>
        <p className="text-white/50 mt-2">Registro alineado con el API de Multisystem</p>
      </div>
      <Card className={brandCard}>
        <CardHeader>
          <CardTitle className="text-white">Datos</CardTitle>
          <CardDescription className="text-white/60">Completa el formulario para Shopflow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className={brandLabel}>Nombre</Label>
              <Input
                className={brandInput}
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
              />
            </div>
            <div>
              <Label className={brandLabel}>Apellido</Label>
              <Input
                className={brandInput}
                value={form.lastName}
                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label className={brandLabel}>Empresa</Label>
            <Input
              className={brandInput}
              value={form.companyName}
              onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
            />
          </div>
          <div>
            <Label className={brandLabel}>Email</Label>
            <Input
              type="email"
              className={brandInput}
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div>
            <Label className={brandLabel}>Contrasena</Label>
            <Input
              type="password"
              className={brandInput}
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            />
          </div>
          <div>
            <Label className={brandLabel}>Confirmar contrasena</Label>
            <Input
              type="password"
              className={brandInput}
              value={form.confirmPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
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
            <Link className="text-indigo-300 underline hover:text-indigo-200" to="/terms">
              terminos
            </Link>
          </label>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <Button
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-xl shadow-lg shadow-indigo-500/25"
            disabled={isLoading}
            onClick={async () => {
              setError(null);
              const parsed = registerSchema.safeParse(form);
              if (!parsed.success) {
                setError(parsed.error.issues[0]?.message || "Formulario invalido");
                return;
              }
              setIsLoading(true);
              try {
                await authApi.post("/register", {
                  email: form.email,
                  password: form.password,
                  firstName: form.firstName,
                  lastName: form.lastName,
                  companyName: form.companyName,
                  shopflowEnabled: true,
                  workifyEnabled: false,
                });
                navigate("/dashboard");
              } catch (e) {
                setError(e instanceof Error ? e.message : "No se pudo registrar");
              } finally {
                setIsLoading(false);
              }
            }}
          >
            {isLoading ? "Creando..." : "Crear cuenta"}
          </Button>
          <div className="text-center">
            <Link className="text-sm text-indigo-300 hover:text-indigo-200" to="/login">
              Ya tengo cuenta
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

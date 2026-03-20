import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@multisystem/ui";
import { authApi } from "@/lib/api/client";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

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

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>Registro alineado con `/api/auth/register`.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nombre</Label><Input value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} /></div>
            <div><Label>Apellido</Label><Input value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} /></div>
          </div>
          <div><Label>Empresa</Label><Input value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))} /></div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
          <div><Label>Contrasena</Label><Input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} /></div>
          <div><Label>Confirmar contrasena</Label><Input type="password" value={form.confirmPassword} onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))} /></div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.termsAccepted} onChange={(e) => setForm((p) => ({ ...p, termsAccepted: e.target.checked }))} />
            Acepto los <Link className="underline" to="/terms">terminos</Link>
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button
            className="w-full"
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
        </CardContent>
      </Card>
    </main>
  );
}

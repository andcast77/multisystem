import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Button,
  Input,
  Label,
} from "@multisystem/ui";
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

  const decorativePanel = (
    <AuthBrandDecorativePanel
      badge="Shopflow"
      title="Tu punto de venta"
      description="Catálogo, ventas y stock con la misma cáscara de auth que el Hub: solo cambia el texto, no el layout."
      quote={<>De la vitrina a la caja, sin fricción.</>}
    />
  );

  return (
    <AuthLayout
      variant="brand"
      contentClassName="max-w-lg"
      panel={decorativePanel}
      className="shopflow-auth-shell shopflow-auth-layout"
    >
      <AuthBrandWelcomeHeader title="Crear cuenta" subtitle="Completa los datos para usar Shopflow" />

      <AuthBrandCard
        cardTitle="Registrarse"
        cardDescription="Completa los campos para crear la cuenta"
        footer={
          <AuthBrandFooterCenter>
            <p className="text-sm text-white/50">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="text-indigo-300 hover:text-indigo-200 font-medium">
                Inicia sesión
              </Link>
            </p>
          </AuthBrandFooterCenter>
        }
      >
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const parsed = registerSchema.safeParse(form);
            if (!parsed.success) {
              setError(parsed.error.issues[0]?.message || "Formulario inválido");
              return;
            }
            if (!form.termsAccepted) return;
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
            } catch (err) {
              setError(err instanceof Error ? err.message : "No se pudo registrar");
            } finally {
              setIsLoading(false);
            }
          }}
        >
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
            <Link className="text-indigo-300 underline hover:text-indigo-200" to="/terms">
              términos
            </Link>
          </label>
          {error ? (
            <AuthBrandErrorAlert variant="error">
              <p className="text-sm text-red-200">{error}</p>
            </AuthBrandErrorAlert>
          ) : null}
          <Button
            type="submit"
            className={AUTH_BRAND_PRIMARY_BUTTON_CLASS}
            disabled={isLoading || !form.termsAccepted}
          >
            {isLoading ? "Registrando…" : "Crear cuenta"}
          </Button>
        </form>
      </AuthBrandCard>
    </AuthLayout>
  );
}

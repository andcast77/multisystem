import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "@/lib/api-client";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ScrollArea,
} from "@multisystem/ui";

export function RegisterPage() {
  const navigate = useNavigate();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const termsAccepted = watch("termsAccepted");

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        await authApi.me();
        navigate("/dashboard", { replace: true });
      } catch {
        // Not logged in, stay on register page
      }
    };

    checkAuth();
  }, [navigate]);

  async function onSubmit(data: RegisterInput) {
    try {
      setErrorMessage("");
      const res = await authApi.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Error al registrar. Intenta de nuevo.");
        return;
      }

      // Show success message instead of auto-login
      setRegistrationEmail(data.email);
      setRegistrationSuccess(true);
    } catch (err: any) {
      console.error("Registration error:", err);
      setErrorMessage(err?.response?.data?.error || err?.message || "Error al registrar");
    }
  }

  const decorativePanel = (
    <>
      <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs text-indigo-700 font-medium mb-6 shadow-sm">
        <span>🚀</span>
        <span>Multisystem Hub</span>
      </div>

      <h2 className="text-4xl font-bold text-white mb-4">
        Tu negocio listo para crecer
      </h2>
      <p className="text-white/80 text-lg leading-relaxed">
        Accede a todas las herramientas que necesitas para gestionar y hacer crecer
        tu negocio con claridad.
      </p>

      <div className="mt-8 pt-8 border-t border-white/30">
        <p className="text-white/60 text-sm italic">
          "Empieza rápido, crece con claridad."
        </p>
      </div>
    </>
  );

  return (
    <>
      <AuthLayout panel={decorativePanel}>
        {/* Logo/Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            {registrationSuccess ? "¡Cuenta creada!" : "Comienza ahora"}
          </h1>
          <p className="text-slate-600 mt-2">
            {registrationSuccess ? "Verifica tu email para continuar" : "Crea tu empresa en el Hub"}
          </p>
        </div>

            {/* Success Message or Register Form Card */}
            {registrationSuccess ? (
              <Card className="border-white/60 bg-white/85 shadow-2xl backdrop-blur">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <CardTitle className="text-2xl">¡Registro exitoso!</CardTitle>
                  <CardDescription>
                    Hemos enviado un email de verificación a <strong>{registrationEmail}</strong>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-sky-50 border border-sky-200">
                    <p className="text-sm text-sky-700 text-center">
                      Por favor revisa tu bandeja de entrada y haz clic en el enlace de verificación para activar tu cuenta
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={() => navigate("/login")}
                      className="w-full"
                    >
                      Ir al Login
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          await authApi.resendVerification(registrationEmail);
                          alert("Email de verificación reenviado. Revisa tu bandeja de entrada.");
                        } catch (error) {
                          alert("Error al reenviar email. Intenta más tarde.");
                        }
                      }}
                      className="w-full"
                    >
                      ¿No recibiste el email? Reenviar
                    </Button>
                  </div>

                  <p className="text-xs text-center text-slate-500">
                    El enlace de verificación expirará en 24 horas
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-white/60 bg-white/85 shadow-2xl backdrop-blur">
                <CardHeader>
                  <CardTitle>Registrarse</CardTitle>
                  <CardDescription>Completa los campos para crear la cuenta</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-auto max-h-[60vh] pr-4">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      {/* Error Message */}
                      {errorMessage && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                          <p className="text-sm text-red-700">{errorMessage}</p>
                        </div>
                      )}
                    {/* Two-column layout for names on medium+ screens */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* First Name */}
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Nombre</Label>
                        <Input
                          id="firstName"
                          placeholder="Juan"
                          {...register("firstName")}
                          className={`rounded-md ${errors.firstName ? "border-red-500" : ""}`}
                        />
                        {errors.firstName && (
                          <p className="text-xs text-red-600">{errors.firstName.message}</p>
                        )}
                      </div>

                      {/* Last Name */}
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Apellido</Label>
                        <Input
                          id="lastName"
                          placeholder="Pérez"
                          {...register("lastName")}
                          className={`rounded-md ${errors.lastName ? "border-red-500" : ""}`}
                        />
                        {errors.lastName && (
                          <p className="text-xs text-red-600">{errors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Company Name */}
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Nombre de la empresa</Label>
                      <Input
                        id="companyName"
                        placeholder="Mi Empresa S.L."
                        {...register("companyName")}
                        className={`rounded-md ${errors.companyName ? "border-red-500" : ""}`}
                      />
                      {errors.companyName && (
                        <p className="text-sm text-red-600">{errors.companyName.message}</p>
                      )}
                    </div>

                    {/* Email */}
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

                    {/* Two-column layout for passwords on medium+ screens */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Password */}
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
                          <p className="text-xs text-red-600">{errors.password.message}</p>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          {...register("confirmPassword")}
                          className={`rounded-md ${errors.confirmPassword ? "border-red-500" : ""}`}
                        />
                        {errors.confirmPassword && (
                          <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Terms Checkbox */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <input
                          id="terms"
                          type="checkbox"
                          {...register("termsAccepted")}
                          className="mt-1"
                        />
                        <label htmlFor="terms" className="text-sm text-slate-700">
                          Acepto los{" "}
                          <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="text-indigo-600 hover:text-indigo-700 font-medium underline"
                          >
                            términos y condiciones
                          </button>
                        </label>
                      </div>
                      {errors.termsAccepted && (
                        <p className="text-sm text-red-600">{errors.termsAccepted.message}</p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isSubmitting || !termsAccepted}
                      className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium py-2 rounded-md transition-all"
                    >
                      {isSubmitting ? "Registrando…" : "Crear cuenta"}
                    </Button>
                  </form>
                </ScrollArea>

                {/* Login Link */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-600">
                    ¿Ya tienes cuenta?{" "}
                    <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                      Inicia sesión
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
            )}
      </AuthLayout>

      {/* Terms & Conditions Modal */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Términos y Condiciones</DialogTitle>
            <DialogDescription>
              Revisa nuestros términos antes de crear tu cuenta
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4 -mr-6 pr-6">
            <div className="space-y-4 text-sm text-slate-600">
              <section>
                <h3 className="font-semibold text-slate-900 mb-2">1. Uso del Servicio</h3>
                <p>
                  Al usar Multisystem Hub, aceptas cumplir con estos términos y todas las
                  leyes y regulaciones aplicables. No debes usar esta plataforma de manera
                  que viole leyes, derechos de terceros, o que afecte negativamente nuestra
                  operación.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-slate-900 mb-2">2. Seguridad de Cuenta</h3>
                <p>
                  Eres responsable de mantener la confidencialidad de tus credenciales de
                  acceso. Notifica inmediatamente sobre cualquier acceso no autorizado. No
                  compartirás tu cuenta con terceros.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-slate-900 mb-2">3. Datos y Privacidad</h3>
                <p>
                  Tus datos se tratan según nuestra Política de Privacidad. Recopilamos y
                  procesamos datos necesarios para proporcionar el servicio. Tienes derechos
                  sobre tus datos según la legislación aplicable.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-slate-900 mb-2">4. Disponibilidad del Servicio</h3>
                <p>
                  Nos esforzamos por proporcionar acceso continuo, pero no garantizamos
                  disponibilidad 100%. Realizamos mantenimiento y actualizaciones que pueden
                  afectar la disponibilidad temporalmente.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-slate-900 mb-2">5. Cambios en los Términos</h3>
                <p>
                  Nos reservamos el derecho de modificar estos términos en cualquier momento.
                  Los cambios significativos serán comunicados con anticipación. El uso
                  continuado implica aceptación de los cambios.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-slate-900 mb-2">6. Contacto</h3>
                <p>
                  Para preguntas sobre estos términos, contacta a nuestro equipo a través de
                  los canales de soporte disponibles en la plataforma.
                </p>
              </section>
            </div>
          </ScrollArea>

          <Button
            onClick={() => setShowTermsModal(false)}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 mt-4"
          >
            Entendido
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

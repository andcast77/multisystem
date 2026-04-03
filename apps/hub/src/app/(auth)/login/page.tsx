"use client";

import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "@/lib/api-client";
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

export default function LoginPage() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

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
        navigate("/dashboard", { replace: true });
      } catch {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [navigate]);

  async function onSubmit(data: LoginInput) {
    try {
      const res = await authApi.login(data.email, data.password);
      if (!res.success || !res.data) return;
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Login error:", err);
    }
  }

  if (isChecking) return null;

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
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>Introduce tus credenciales</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium py-2 rounded-md transition-all"
            >
              {isSubmitting ? "Iniciando sesión…" : "Iniciar sesión"}
            </Button>
          </form>

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
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

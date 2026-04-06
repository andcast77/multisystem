'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
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
} from '@multisystem/ui';
import { authApi } from '@/lib/api/client';

const workifyRegisterPanel = (
  <AuthBrandDecorativePanel
    badge="Workify"
    title="Tu equipo, en orden"
    description="Alta de empresa y usuarios con el mismo layout de registro que el Hub y Shopflow; solo el texto es propio de Workify."
    quote={<>RRHH y operación, bajo la misma cuenta.</>}
  />
);

function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function sanitizeInput(value: string): string {
  return value
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .substring(0, 100);
}

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [isLoading, startTransition] = useTransition();
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    setCsrfToken(generateCSRFToken());
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 100;
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8 && password.length <= 128;
  };

  const validatePasswordComplexity = (password: string): boolean => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    return hasUpperCase && hasLowerCase && hasNumbers;
  };

  const validateCompanyName = (name: string): boolean => {
    return name.length >= 2 && name.length <= 100;
  };

  const validateName = (name: string): boolean => {
    return name.length >= 1 && name.length <= 50;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (!formData.lastName.trim()) {
      setError('El apellido es requerido');
      return;
    }

    if (!formData.companyName.trim()) {
      setError('El nombre de la empresa es requerido');
      return;
    }

    if (!formData.email.trim()) {
      setError('El email es requerido');
      return;
    }

    if (!formData.password.trim()) {
      setError('La contraseña es requerida');
      return;
    }

    if (!formData.confirmPassword.trim()) {
      setError('La confirmación de contraseña es requerida');
      return;
    }

    if (!validateName(formData.firstName)) {
      setError('El nombre debe tener entre 1 y 50 caracteres');
      return;
    }

    if (!validateName(formData.lastName)) {
      setError('El apellido debe tener entre 1 y 50 caracteres');
      return;
    }

    if (!validateCompanyName(formData.companyName)) {
      setError('El nombre de la empresa debe tener entre 2 y 100 caracteres');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Formato de email inválido');
      return;
    }

    if (!validatePassword(formData.password)) {
      setError('La contraseña debe tener entre 8 y 128 caracteres');
      return;
    }

    if (!validatePasswordComplexity(formData.password)) {
      setError('La contraseña debe contener mayúsculas, minúsculas y números');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!csrfToken) {
      setError('Error de seguridad. Recarga la página e intenta de nuevo.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await authApi.post<{
          success?: boolean;
          data?: { user?: unknown };
          error?: string;
        }>('/register', {
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
          companyName: formData.companyName.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          csrfToken,
        });

        const err = (res as { error?: string })?.error;
        if (err) {
          setError(err);
          return;
        }
        const user =
          (res as { data?: { user?: unknown } })?.data?.user ?? (res as { user?: unknown }).user;
        if (!user) {
          setError('Respuesta del servidor inválida');
          return;
        }
        window.location.href = '/dashboard';
      } catch (err) {
        console.error('Error de registro:', err);
        setError('Error de conexión. Inténtalo de nuevo.');
      }
    });
  };

  return (
    <AuthLayout variant="brand" contentClassName="max-w-lg" panel={workifyRegisterPanel}>
      <AuthBrandWelcomeHeader title="Comienza ahora" subtitle="Crea tu empresa en Workify" />

      <AuthBrandCard
        cardTitle="Registrarse"
        cardDescription="Completa los campos para crear la cuenta"
        footer={
          <AuthBrandFooterCenter>
            <p className="text-sm text-white/50">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-indigo-300 hover:text-indigo-200 font-medium">
                Inicia sesión
              </Link>
            </p>
          </AuthBrandFooterCenter>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="csrfToken" value={csrfToken} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reg-firstName" className={AUTH_BRAND_LABEL_CLASS}>
                Nombre
              </Label>
              <Input
                id="reg-firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={isLoading}
                maxLength={50}
                autoComplete="given-name"
                className={AUTH_BRAND_INPUT_CLASS}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-lastName" className={AUTH_BRAND_LABEL_CLASS}>
                Apellido
              </Label>
              <Input
                id="reg-lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={isLoading}
                maxLength={50}
                autoComplete="family-name"
                className={AUTH_BRAND_INPUT_CLASS}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-company" className={AUTH_BRAND_LABEL_CLASS}>
              Nombre de la empresa
            </Label>
            <Input
              id="reg-company"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              disabled={isLoading}
              maxLength={100}
              autoComplete="organization"
              className={AUTH_BRAND_INPUT_CLASS}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-email" className={AUTH_BRAND_LABEL_CLASS}>
              Email
            </Label>
            <Input
              id="reg-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@empresa.com"
              required
              disabled={isLoading}
              maxLength={100}
              autoComplete="email"
              className={AUTH_BRAND_INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reg-password" className={AUTH_BRAND_LABEL_CLASS}>
                Contraseña
              </Label>
              <Input
                id="reg-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                disabled={isLoading}
                maxLength={128}
                autoComplete="new-password"
                className={AUTH_BRAND_INPUT_CLASS}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-confirm" className={AUTH_BRAND_LABEL_CLASS}>
                Confirmar contraseña
              </Label>
              <Input
                id="reg-confirm"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                disabled={isLoading}
                maxLength={128}
                autoComplete="new-password"
                className={AUTH_BRAND_INPUT_CLASS}
              />
            </div>
          </div>

          {error ? (
            <AuthBrandErrorAlert variant="error">
              <p className="text-sm text-red-200">{error}</p>
            </AuthBrandErrorAlert>
          ) : null}

          <Button type="submit" disabled={isLoading} className={AUTH_BRAND_PRIMARY_BUTTON_CLASS}>
            {isLoading ? 'Registrando…' : 'Crear cuenta'}
          </Button>
        </form>
      </AuthBrandCard>
    </AuthLayout>
  );
}

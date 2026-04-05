'use client';

import { useState, useTransition, useEffect, type ChangeEvent } from 'react';
import { AuthLayout, Button, InputField } from '@multisystem/ui';
import { authApi } from '@/lib/api/client';
const workifyPanel = (
  <>
    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-indigo-200 font-medium mb-6">
      Workify
    </div>
    <h2 className="text-4xl font-bold text-white mb-4">Recursos humanos</h2>
    <p className="text-white/80 text-lg leading-relaxed">Gestión de equipos y asistencia con identidad Multisystem.</p>
  </>
);

type CompanyOption = { id: string; name: string; workifyEnabled?: boolean; shopflowEnabled?: boolean };

// Función para generar token CSRF
function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Función para sanitizar input
function sanitizeInput(value: string): string {
  return value
    .trim()
    .replace(/[<>]/g, '') // Remover caracteres peligrosos
    .replace(/javascript:/gi, '') // Remover javascript: protocol
    .replace(/data:/gi, '') // Remover data: protocol
    .replace(/vbscript:/gi, '') // Remover vbscript: protocol
    .substring(0, 100); // Limitar longitud
}

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, startTransition] = useTransition();
  const [csrfToken, setCsrfToken] = useState('');
  const [companies, setCompanies] = useState<CompanyOption[] | null>(null);
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaTempToken, setMfaTempToken] = useState<string | null>(null);
  const [mfaCompanyId, setMfaCompanyId] = useState<string | undefined>(undefined);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaBackup, setMfaBackup] = useState(false);

  // Generar token CSRF al montar el componente
  useEffect(() => {
    setCsrfToken(generateCSRFToken());
  }, []);

  // Validar email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 100;
  };

  // Validar contraseña
  const validatePassword = (password: string): boolean => {
    return password.length >= 6 && password.length <= 128;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedEmail = sanitizeInput(e.target.value);
    setEmail(sanitizedEmail);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedPassword = sanitizeInput(e.target.value);
    setPassword(sanitizedPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones del lado del cliente
    if (!email.trim()) {
      setError('El email es requerido');
      return;
    }

    if (!password.trim()) {
      setError('La contraseña es requerida');
      return;
    }

    if (!validateEmail(email)) {
      setError('Formato de email inválido');
      return;
    }

    if (!validatePassword(password)) {
      setError('La contraseña debe tener entre 6 y 128 caracteres');
      return;
    }

    // Validar token CSRF
    if (!csrfToken) {
      setError('Error de seguridad. Recarga la página e intenta de nuevo.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await authApi.post<{
          success?: boolean;
          data?: { user: unknown; companyId?: string; company?: unknown; companies?: CompanyOption[] };
          error?: string;
        }>('/login', {
          email: email.toLowerCase().trim(),
          password,
          csrfToken,
        });

        const data =
          res && typeof res === 'object' && 'data' in res
            ? (res as { data?: { user: unknown; companyId?: string; companies?: CompanyOption[] } }).data
            : undefined;
        const err = (res as { error?: string })?.error;
        if (err) {
          setError(err);
          return;
        }

        const mfaData = data as { mfaRequired?: boolean; tempToken?: string; companyId?: string } | undefined;
        if (mfaData?.mfaRequired && mfaData.tempToken) {
          setMfaTempToken(mfaData.tempToken);
          setMfaCompanyId(mfaData.companyId);
          setMfaStep(true);
          setMfaCode('');
          setMfaBackup(false);
          return;
        }

        const companyId = data?.companyId ?? (res as { companyId?: string }).companyId;
        const companiesList = data?.companies ?? (res as { companies?: CompanyOption[] }).companies;

        if (!data?.user && !(res as { user?: unknown }).user) {
          setError('Respuesta del servidor inválida');
          return;
        }

        if (companiesList && companiesList.length > 1 && !companyId) {
          setCompanies(companiesList);
          return;
        }

        window.location.href = '/dashboard';
      } catch (err) {
        console.error('Error de login:', err);
        setError('Error de conexión. Inténtalo de nuevo.');
      }
    });
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!mfaTempToken || !mfaCode.trim()) {
      setError('Introduce el código.');
      return;
    }
    startTransition(async () => {
      try {
        const res = mfaBackup
          ? await authApi.post<{ success?: boolean; error?: string }>('/mfa/verify-backup', {
              tempToken: mfaTempToken,
              backupCode: mfaCode.trim(),
              companyId: mfaCompanyId,
            })
          : await authApi.post<{ success?: boolean; error?: string }>('/mfa/verify', {
              tempToken: mfaTempToken,
              totpCode: mfaCode.trim(),
              companyId: mfaCompanyId,
            });
        const ok = res && typeof res === 'object' && (res as { success?: boolean }).success === true;
        if (!ok) {
          setError((res as { error?: string })?.error || 'Código inválido');
          return;
        }
        window.location.href = '/dashboard';
      } catch (err) {
        console.error('MFA error:', err);
        setError('Código inválido o sesión expirada.');
      }
    });
  };

  const handleChooseCompany = async (companyId: string) => {
    setError('');
    startTransition(async () => {
      try {
        const res = await authApi.post<{ success?: boolean; error?: string }>('/context', { companyId });
        if (res && typeof res === 'object' && !(res as { success?: boolean }).success && (res as { error?: string }).error) {
          setError((res as { error?: string }).error!);
          return;
        }
        window.location.href = '/dashboard';
      } catch (err) {
        console.error('Error al elegir empresa:', err);
        setError('Error al elegir empresa. Inténtalo de nuevo.');
      }
    });
  };

  if (mfaStep && mfaTempToken) {
    return (
      <AuthLayout variant="brand" panel={workifyPanel}>
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 sm:p-8 text-white">
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-gray-900 mb-2">Verificación en dos pasos</h1>
              <p className="text-sm text-gray-600">
                {mfaBackup ? 'Introduce un código de respaldo.' : 'Introduce el código de tu app autenticadora.'}
              </p>
            </div>
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <InputField
                label={mfaBackup ? 'Código de respaldo' : 'Código TOTP'}
                type="text"
                value={mfaCode}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setMfaCode(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="one-time-code"
              />
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={() => {
                  setMfaBackup(!mfaBackup);
                  setMfaCode('');
                }}
              >
                {mfaBackup ? 'Usar código TOTP' : 'Usar código de respaldo'}
              </button>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">{error}</div>
              )}
              <Button type="submit" disabled={isLoading} loading={isLoading} className="w-full">
                Continuar
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setMfaStep(false);
                  setMfaTempToken(null);
                  setMfaCode('');
                  setError('');
                }}
              >
                Volver
              </Button>
            </form>
                  </div>
      </AuthLayout>
    );
  }

  if (companies && companies.length > 1) {
    return (
      <AuthLayout variant="brand" panel={workifyPanel}>
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 sm:p-8 text-white">
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-gray-900 mb-2">Elige una empresa</h1>
              <p className="text-sm text-gray-600">Tienes acceso a varias empresas. Selecciona con cuál continuar.</p>
            </div>
            <div className="space-y-2">
              {companies.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleChooseCompany(c.id)}
                  disabled={isLoading}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-colors"
                >
                  <span className="font-medium text-gray-900">{c.name}</span>
                </button>
              ))}
            </div>
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">{error}</div>
            )}
                  </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout variant="brand" panel={workifyPanel}>
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 sm:p-8 text-white">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Iniciar Sesión</h1>
            <p className="text-sm sm:text-base text-gray-600">Accede a tu cuenta</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Token CSRF oculto */}
            <input type="hidden" name="csrfToken" value={csrfToken} />
            
            <InputField
              label="Email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="tu@email.com"
              required
              disabled={isLoading}
              maxLength={100}
              autoComplete="email"
            />
            <InputField
              label="Contraseña"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="••••••••"
              required
              disabled={isLoading}
              maxLength={128}
              autoComplete="current-password"
            />
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded-md text-xs sm:text-sm">{error}</div>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              loading={isLoading}
              className="w-full"
            >
              {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
            </Button>
            <div className="text-center">
              <a href="#" className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 transition-colors">¿Olvidaste tu contraseña?</a>
            </div>
          </form>
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-xs text-gray-500">© 2024 Workify</p>
          </div>
                </div>
      </AuthLayout>
  );
} 
